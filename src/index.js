#!/usr/bin/env node
import { logUser, deviceListAll, deviceConnect, deviceSend } from 'remot3-it-api';
import inquirer from 'inquirer';

import { formatDeviceNames, formatLink, formatExpirationTime, log } from './utils';

export const ERROR_NO_REGISTERED_DEVICES =
  'Remot3.it server contacted, but there are no registered devices';
export const ERROR_MISSING_DEVICE_ADDRESS =
  'Device address was not specified';


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
    log.error(error);
  }
};

export const listAllRegisteredDevices = async () => {
  try {
    const devices = await deviceListAll();
    if (devices.length === 0) {
      log.error(ERROR_NO_REGISTERED_DEVICES);
      return;
    }
    return {
      names: formatDeviceNames(devices),
      details: devices,
    };
  } catch (error) {
    log.error(error);
  }
};

export const selectDevice = async (deviceNames) => {
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

export const askForActionWithDevice = async () => {
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

export const connectToDevice = async (deviceAddress, serviceType = null) => {
  if (!deviceAddress) {
    log.error(ERROR_MISSING_DEVICE_ADDRESS);
    return;
  }

  try {
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
    log.info(text);
  } catch (error) {
    log.error(error);
  }
};

export const sendCommandToDevice = async (deviceAddress) => {
  if (!deviceAddress) {
    log.error(ERROR_MISSING_DEVICE_ADDRESS);
    return;
  }
  const forCommand = {
    type: 'input',
    name: 'command',
    message: 'Specify command'
  }
  const { command } = await inquirer.prompt(forCommand);
  try {
    const status = await deviceSend(deviceAddress, command);
    log.info(status);
  } catch (error) {
    log.error(error);
  }
};

const workWithDevices = async (devices) => {
  try {
    const selectedDevice = devices && await selectDevice(devices.names);
    const { deviceaddress, servicetitle } = devices && devices
      .details
      .find(device => device.devicealias === selectedDevice);

    if (!deviceaddress) {
      log.error(ERROR_MISSING_DEVICE_ADDRESS);
      return;
    }

    const action = await askForActionWithDevice();
    switch (action) {
      // case 'Send command':
      //   sendCommandToDevice(deviceaddress);
      //   workWithDevices(devices);
      //   break;
      case 'Connect to device':
        await connectToDevice(deviceaddress, servicetitle);
        workWithDevices(devices);
        break;
      case 'Return back':
        workWithDevices(devices);
        break;
      case 'Exit':
      default:
        process.exit(0);
    }
  } catch (error) {
    log.error(error);
  }

};

const main = async () => {
  await authorization();
  const devices = await listAllRegisteredDevices();
  if (!devices) return;
  workWithDevices(devices);
};
main();