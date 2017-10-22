#!/usr/bin/env node
const { logUser, deviceListAll, deviceConnect } = require('remot3-it-api');
const inquirer = require('inquirer');

const authorization = async () => {
  const forCredentials = [
    {
      type: 'input',
      message: 'Enter a username',
      name: 'username',
    },
    {
      type: 'password',
      message: 'Enter password',
      name: 'password',
      mask: '*',
    },
  ];
  const { username, password } = await inquirer.prompt(forCredentials);
  try {
    await logUser(username, password);
  } catch (error) {
    console.error(error);
  }
};

const listAllRegisteredDevices = async () => {
  try {
    const devices = await deviceListAll();
    if (devices.length === 0) {
      console.error(
        'Remot3.it server contacted, but there are no registered devices',
      );
    }
    return {
      names: devices
        .reduce((allDevices, { devicealias, devicestate, servicetitle }) => {
          const deviceRecord = { name: `[${servicetitle}] ${devicealias}`, value: devicealias };
          const deviceStatus = devicestate === 'active'
            ? { disabled: false }
            : { disabled: 'Device is inactive' };
          return [...allDevices, Object.assign(deviceRecord, deviceStatus)];
        }, []),
      details: devices,
    };
  } catch (error) {
    console.error(error);
  }
};

const selectDevice = async (deviceNames) => {
  const forDevice = [
    {
      type: 'list',
      name: 'device',
      message: 'Select device',
      choices: deviceNames,
    },
  ];
  const { device } = await inquirer.prompt(forDevice);
  return device;
};

const askForActionWithDevice = async () => {
  const forAction = [{
    type: 'list',
    name: 'action',
    message: 'Select action',
    choices: ['Send command', 'Connect to device', new inquirer.Separator(), 'Return back'],
  }];
  const { action } = await inquirer.prompt(forAction);
  return action;
};

const formatVNCLink = (link) => {
  const domain = link.match(/^(?:https?:\/\/)?(?:www\.)?([^:\/\n\?\=]+)/);
  const port = link.match(/(?:port=)([0-9]+)/);
  return domain ? `vnc://${domain[1]}:${port[1]}` : 'none';
};

const formatExpirationTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec - (minutes * 60);
  return `Expire in ${minutes} minutes ${seconds} seconds`;
};

const connectToDevice = async (selectedDevice, devices) => {
  const selectedDeviceDetails = devices && devices
    .details
    .find(device => device.devicealias === selectedDevice);
  const uid = selectedDeviceDetails
    ? selectedDeviceDetails.deviceaddress
    : console.error('Device\'s uid not found');
  const { proxy, expirationsec } = await deviceConnect(uid);
  const timeUntilExpire = formatExpirationTime(expirationsec);
  let text;
  switch (selectedDeviceDetails.servicetitle) {
    case 'VNC':
      text = `
      web link: ${proxy},
      vnc link: ${formatVNCLink(proxy)}

      ${timeUntilExpire}
      `;
      break;
    case 'SSH':
      text = `
      ssh link: ssh ${proxy}

      ${timeUntilExpire}
      `;
      break;
    default:
      text = `
      link: ${proxy}
      
      ${timeUntilExpire}
      `;
  }
  console.log(text);
};

const sendCommandToDevice = async () => {

};


const workWith = async (devices) => {
  const selectedDevice = devices && await selectDevice(devices.names);
  const action = await askForActionWithDevice(selectedDevice);
  switch (action) {
    case 'Return back':
      workWith(devices);
      break;
    case 'Send command':
      sendCommandToDevice();
      break;
    case 'Connect to device':
      connectToDevice(selectedDevice, devices);
      break;
    default:
  }
};

const main = async () => {
  await authorization();
  const devices = await listAllRegisteredDevices();
  workWith(devices);
};
main();
