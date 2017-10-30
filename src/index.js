#!/usr/bin/env node
import { logUser, deviceListAll, deviceConnect, deviceSend } from 'remot3-it-api';
import inquirer from 'inquirer';

export const authorization = async () => {
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
          if (servicetitle === 'Bulk Service') {
            return [...allDevices];
          }
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
    choices: [
      // 'Send command', 
      'Connect to device',
      new inquirer.Separator(),
      'Return back',
      'Exit'
    ],
  }];
  const { action } = await inquirer.prompt(forAction);
  return action;
};


const formatLink = (link, type) => {
  const domain = link.match(/^(?:https?:\/\/)?(?:www\.)?([^:\/\n\?\=]+)/);
  const port = link.match(/(?:port=|\:)([0-9]+)/);
  switch (type) {
    case 'VNC':
      return domain ? `vnc://${domain[1]}:${port[1]}` : 'none';
      break;
    case 'SSH':
      return domain ? `ssh -l LOGIN ${domain[1]} -p ${port[1]}` : 'none';
      break;
  }
};

const formatExpirationTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec - (minutes * 60);
  return `Expire in ${minutes} minutes ${seconds} seconds`;
};

const connectToDevice = async (deviceAddress, serviceType) => {
  const { proxy, expirationsec } = await deviceConnect(deviceAddress);
  const timeUntilExpire = formatExpirationTime(expirationsec);

  let text;
  switch (serviceType) {
    case 'VNC':
      text = `
      web link: ${proxy}
      vnc link: ${formatLink(proxy, serviceType)}

      ${timeUntilExpire}
      `;
      break;
    case 'SSH':
      text = `
      ssh link: ${formatLink(proxy, serviceType)}

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

const sendCommandToDevice = async (deviceAddress) => {
  const forCommand = {
    type: 'input',
    name: 'command',
    message: 'Specify command'
  }
  const { command } = await inquirer.prompt(forCommand);
  const status = await deviceSend(deviceAddress, command);
  console.log(status);
};

const workWith = async (devices) => {
  const selectedDevice = devices && await selectDevice(devices.names);
  const selectedDeviceDetails = devices && devices
    .details
    .find(device => device.devicealias === selectedDevice);

  const { deviceaddress, servicetitle } = selectedDeviceDetails;
  if (!deviceaddress) {
    console.error('Device\'s uid not found');
    return;
  }

  const action = await askForActionWithDevice();
  switch (action) {
    // case 'Send command':
    //   sendCommandToDevice(deviceaddress);
    //   workWith(devices);
    //   break;
    case 'Connect to device':
      await connectToDevice(deviceaddress, servicetitle);
      workWith(devices);
      break;
    case 'Return back':
      workWith(devices);
      break;
    case 'Exit':
    default:
      process.exit(0);
  }
};

const main = async () => {
  await authorization();
  const devices = await listAllRegisteredDevices();
  workWith(devices);
};
main();