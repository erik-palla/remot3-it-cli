import { expect } from 'chai';
import sinon from 'sinon';

import * as utils from '../src/utils';
import deviceListJson from './mocks/devicelist.json';

describe('UTILS', () => {
  describe('formatDeviceNames', () => {
    const bulkService = 'Bulk Service';
    const expectedState = [
      { name: '[SSH] SSH-device', value: 'SSH-device', disabled: false },
      { name: '[VNC] VNC-device', value: 'VNC-device', disabled: utils.INFO_DEVICE_INACTIVE },
    ];
    let actualState;
    beforeEach(() => {
      actualState = utils.formatDeviceNames(deviceListJson);
    });
    afterEach(() => {
      actualState = null;
    });
    it('should return devices names in format for inquirer', () => {
      expect(actualState).to.deep.equal(expectedState);
    });
    it('should diferenciate active device', () => {
      const activeDevice = deviceListJson
        .find(device => device.devicestate === 'active' && device.servicetitle !== bulkService);
      const actualStateActiveDevice = actualState
        .find(device => device.value === activeDevice.devicealias)
      expect(actualStateActiveDevice.disabled).to.be.false;
    });
    it('should diferenciate inactive device', () => {
      const inactiveDevice = deviceListJson
        .find(device => device.devicestate !== 'active' && device.servicetitle !== bulkService);
      const actualStateInactiveDevice = actualState
        .find(device => device.value === inactiveDevice.devicealias)
      expect(actualStateInactiveDevice.disabled).to.equal(utils.INFO_DEVICE_INACTIVE);
    });
    it('should ignore "Bulk service" device', () => {
      const bulkServiceDevice = deviceListJson
        .find(device => device.servicetitle === bulkService);
      const deviceMissingInExpectedState = expectedState
        .filter(device => device.devicealias === bulkServiceDevice.devicealias)
        .length === 0;
      expect(deviceMissingInExpectedState).to.be.true;
    });
  });
  describe('formatLink', () => {
    const link = 'https://domain.com:12345';
    ['SSH', 'VNC'].forEach(type => {
      it(`should format link to correct format for ${type}`, () => {
        const formatedLink = utils.formatLink(link, type);
        if (type === 'VNC') expect(formatedLink).to.equal('vnc://domain.com:12345');
        if (type === 'SSH') expect(formatedLink).to.equal('ssh -l LOGIN domain.com -p 12345');
      });
    })
  });
  describe('formatExpirationTime', () => {
    it('should return seconds formated as minutes and seconds', () => {
      const sec = 1796;
      const formatedTime = utils.formatExpirationTime(sec);
      expect(formatedTime).to.be.equal(`Expire in 29 minutes 56 seconds`);
    });
  });
})


