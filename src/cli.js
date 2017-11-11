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

/**
 * Triggers prompt for credentials collecting, then calls Remot3.it API for setting authorization
 * header
 */
export const authorization = async () => {
  const { username, password } = await askForCredentials();
  try {
    await logUser(username, password);
  } catch (error) {
    log.error(error);
  }
};

/**
 * Asks Remot3.it API for information on all devices registered to user
 * @returns {Object} devices - details about devices returned from API
 * @returns {array} devices.names - names extracted from response and formated for inquirer
 * @returns {array} device.details - complete response from API
 */
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

/**
 * Contacts API and ask for details for connection, format depends on type of service
 * @param {string} deviceAddress - address of selected device 
 * @param {string} serviceType - type of service for which is asked, for example - VNC 
 */
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

/**
 * Should send command to selected device. Unfortunatelly this endpoint is not fully described in
 * API documentation, so it is not fully clear how to use it correctly
 * @param {string} deviceAddress - address of selected device 
 */
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

/**
 * Asks user for device selection and triggers action with devices following user selection
 * @param {array} devices - list of devices registered to user account 
 */
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