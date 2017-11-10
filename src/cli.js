import ncp from 'copy-paste';
import {
  logUser,
  deviceListAll,
  deviceConnect,
  deviceSend
} from 'remot3-it-api';

import {
  formatDeviceNames,
  formatLink,
  formatExpirationTime,
  log,
  terminateApp,
  changeTextStyle
} from './utils';

import {
  askForActionWithDevice,
  askForDeviceSelection,
  askForCredentials,
  askForCommand
} from './prompts';

export const ERROR_NO_REGISTERED_DEVICES =
  'Remot3.it server contacted, but there are no registered devices';
export const ERROR_MISSING_DEVICE_ADDRESS =
  'Device address was not specified';

export const authorization = async () => {
  const { username, password } = await askForCredentials();
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

export const connectToDevice = async (deviceAddress, serviceType = null) => {
  if (!deviceAddress) {
    log.error(ERROR_MISSING_DEVICE_ADDRESS);
    return;
  }

  try {
    const { proxy, expirationsec } = await deviceConnect(deviceAddress);
    const timeUntilExpire = formatExpirationTime(expirationsec);

    const link = proxy && formatLink(proxy, serviceType);
    link && ncp.copy(link);
    const decoratedLink = link && changeTextStyle(link, 'bold');
 
    const webProxy = proxy && changeTextStyle(proxy, 'bold');

    const notifyLinkWasCopied = changeTextStyle('(link was copied to OS clipboard)', 'blue');

    let text;
    switch (serviceType) {
      case 'VNC':
        text = `
        web link: ${webProxy}
        vnc link: ${link} ${notifyLinkWasCopied}
  
        ${timeUntilExpire}
        `;
        break;
      case 'SSH':

        text = `
        ssh link: ${link} ${notifyLinkWasCopied}
  
        ${timeUntilExpire}
        `;
        break;
      default:
        text = `
        link: ${webProxy}
        
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
  const command = await askForCommand();
  try {
    const status = await deviceSend(deviceAddress, command);
    log.info(status);
  } catch (error) {
    log.error(error);
  }
};

export const workWithDevices = async (devices) => {
  if (!devices) {
    log.error(ERROR_NO_REGISTERED_DEVICES);
    return;
  }
  try {
    const selectedDevice = await askForDeviceSelection(devices.names);
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
        await exports.connectToDevice(deviceaddress, servicetitle);
        exports.workWithDevices(devices);
        break;
      case 'Return back':
        exports.workWithDevices(devices);
        break;
      case 'Exit':
      default:
        terminateApp();
    }
  } catch (error) {
    log.error(error);
  }
};