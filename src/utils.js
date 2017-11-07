export const INFO_DEVICE_INACTIVE = 'Device is inactive';

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

export const formatLink = (link, type) => {
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

export const formatExpirationTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec - (minutes * 60);
  return `Expire in ${minutes} minutes ${seconds} seconds`;
};

export const log = {
  info(msg) {
    console.log(msg);
  },
  error(msg) {
    console.error(msg);
  }
}

export const terminateApp = () => {
  process.exit(0);
}