export const INFO_DEVICE_INACTIVE = 'Device is inactive';

/**
 * Formats devices names to form suitable for use in inquirer
 * @param {array} devices - array of devices registered to user account 
 */
export const formatDeviceNames = (devices) => !!devices && devices
  .reduce((allDevices, { devicealias, devicestate, servicetitle }) => {
    if (servicetitle === 'Bulk Service') {
      return [...allDevices];
    }
    const deviceRecord = { name: `[${servicetitle}] ${devicealias}`, value: devicealias };
    const deviceStatus = devicestate === 'active'
      ? { disabled: false }
      : { disabled: INFO_DEVICE_INACTIVE };
    return [...allDevices, Object.assign(deviceRecord, deviceStatus)];
  }, []);

/**
 * 
 * @param {string} link - connection link to selected device
 * @param {string} type - type of connection, for example - VNC, SSH...
 */
export const formatLink = (link, type) => {
  const domain = link.match(/^(?:https?:\/\/)?(?:www\.)?([^:\/\n\?\=]+)/);
  const port = link.match(/(?:port=|\:)([0-9]+)/);
  switch (type) {
    case 'VNC':
      return domain ? `${domain[1]}:${port[1]}` : 'none';
      break;
    case 'SSH':
      return domain ? `ssh -l LOGIN ${domain[1]} -p ${port[1]}` : 'none';
      break;
  }
};

/**
 * Formats seconds to connection expiration to more readable format 
 * @param {number} sec 
 */
export const formatExpirationTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec - (minutes * 60);
  return `Expire in ${minutes} minutes ${seconds} seconds`;
};

const SWATCHES = {
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  standard: ''
}

/**
 * Stylize text before passing through
 * @param {string} msg - message which have to be send to stdout 
 * @param {string} style - style in which should be message wrapped/shown
 */
export const changeTextStyle = (msg, style = 'standard') =>
  `${SWATCHES[style]
    ? SWATCHES[style]
    : SWATCHES.standard}${msg}${SWATCHES.reset}`;


export const log = {
  info(msg) {
    console.log(msg);
  },
  error(msg) {
    console.error(changeTextStyle(msg, 'red'));
  }
}

export const terminateApp = () => {
  process.exit(0);
}