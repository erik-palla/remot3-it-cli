import { expect } from 'chai';
import sinon from 'sinon';

import inquirer from 'inquirer';
import * as api from 'remot3-it-api';

import {
  ERROR_NO_REGISTERED_DEVICES,
  INFO_DEVICE_INACTIVE,
  authorization,
  getNamesFrom,
  listAllRegisteredDevices
} from '../src';

import deviceListJson from './mocks/devicelist.json';

describe('Remot3.it CLI', () => {
  describe('authorization', () => {
    const username = 'username';
    const password = 'password';
    let prompt;
    let logUser;
    beforeEach(() => {
      prompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ username, password });

      logUser = sinon
        .stub(api, 'logUser')
        .resolves();
    });
    afterEach(() => {
      prompt.restore();
      logUser.restore();
    })

    it('should ask for credentials', async () => {
      try {
        await authorization();
        expect(prompt.called).to.be.true;
      } catch (error) {
        console.error(error);
      }
    });
    it('should log user into API', async () => {
      try {
        await authorization();
        expect(logUser.calledWith(username, password)).to.be.true;
      } catch (error) {
        console.error(error);
      }
    });
  });
  describe('getNamesFrom', () => {
    const bulkService = 'Bulk Service';
    const expectedState = [
      { name: '[SSH] SSH-device', value: 'SSH-device', disabled: false },
      { name: '[VNC] VNC-device', value: 'VNC-device', disabled: INFO_DEVICE_INACTIVE },
    ];
    let actualState;
    beforeEach(() => {
      actualState = getNamesFrom(deviceListJson);
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
      expect(actualStateInactiveDevice.disabled).to.equal(INFO_DEVICE_INACTIVE);
    });
    it('should ignore "Bulk service" device', () => {
      const bulkServiceDevice = deviceListJson
        .find(device => device.servicetitle === bulkService);
      const deviceMissingInExpectedState = expectedState
        .filter(device => device.devicealias === bulkServiceDevice.devicealias)
        .length === 0;
      expect(deviceMissingInExpectedState).to.be.true;
    });
  })
  describe('listAllRegisteredDevices', () => {
    let listDevices;
    let logError;
    beforeEach(() => {
      listDevices = sinon
        .stub(api, 'deviceListAll')
      logError = sinon
        .stub(console, 'error');
    });
    afterEach(() => {
      listDevices.restore();
      logError.restore();
    })
    it('should ask for list of devices from API', async () => {
      listDevices.resolves([]);
      try {
        await listAllRegisteredDevices();
        expect(listDevices.called).to.be.true;
      } catch (error) {
        console.error(error);
      }
    });
    it('should return notification if there is no device', async () => {
      listDevices.resolves([]);
      try {
        await listAllRegisteredDevices();
        expect(logError.calledWith(ERROR_NO_REGISTERED_DEVICES)).to.be.true;
      } catch (error) {
        console.error(error);
      }
    });
    it('should call function for formatting device names', async () => {
      listDevices.resolves(deviceListJson);
      const getNames = sinon.spy(getNamesFrom);
      try {
        const devices = await listAllRegisteredDevices();
        getNames.restore();
        expect(getNames.calledOnce).to.be.true;
      } catch (error) {
        console.error(error);
      }
    });
    it('should return devices details', async () => {
      listDevices.resolves(deviceListJson);
      try {
        const devices = await listAllRegisteredDevices();
        expect(devices.details).to.deep.equal(deviceListJson);
      } catch (error) {
        console.error(error);
      }
    });
  });
});
describe('selectDevice', () => {

});
describe('askForActionWithDevice', () => {

});
describe('formatLink', () => {

});
describe('formatExpirationTime', () => {

});
describe('connectToDevice', () => {

});
describe('sendCommandToDevice', () => {

});
describe('workWith', () => {

});
describe('main', () => {

});

