import { expect } from 'chai';
import sinon from 'sinon';

import inquirer from 'inquirer';
import * as api from 'remot3-it-api';

import * as src from '../src/index';
import * as utils from '../src/utils'
import deviceListJson from './mocks/devicelist.json';

describe('CLI  ', () => {
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
      await src.authorization();
      expect(prompt.called).to.be.true;
    });
    it('should log user into API', async () => {
      await src.authorization();
      expect(logUser.calledWith(username, password)).to.be.true;
    });
  });
  describe('listAllRegisteredDevices', () => {
    let listDevices;
    let logError;
    beforeEach(() => {
      listDevices = sinon
        .stub(api, 'deviceListAll')
      logError = sinon
        .stub(utils.log, 'error');
    });
    afterEach(() => {
      listDevices.restore();
      logError.restore();
    })
    it('should ask for list of devices from API', async () => {
      listDevices.resolves([]);
      await src.listAllRegisteredDevices();
      expect(listDevices.called).to.be.true;
    });
    it('should return notification if there is no device', async () => {
      listDevices.resolves([]);
      await src.listAllRegisteredDevices();
      expect(logError.calledWith(src.ERROR_NO_REGISTERED_DEVICES)).to.be.true;
    });
    it('should call function for formating device names', async () => {
      listDevices.resolves(deviceListJson);
      const formatNames = sinon.spy(utils, 'formatDeviceNames');
      await src.listAllRegisteredDevices();
      formatNames.restore();
      expect(formatNames.calledOnce).to.be.true;
    });
    it('should return devices details', async () => {
      listDevices.resolves(deviceListJson);
      const devices = await src.listAllRegisteredDevices();
      expect(devices.details).to.deep.equal(deviceListJson);
    });
  });
  describe('selectDevice', () => {
    const device = 'some device';
    const deviceNames = [
      { name: '[SSH] SSH-device', value: 'SSH-device', disabled: false }
    ];

    let selectDevicePrompt;
    beforeEach(() => {
      selectDevicePrompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ device });
    });
    afterEach(() => {
      selectDevicePrompt.restore();
    });
    it('should be called with device names', async () => {
      await src.selectDevice(deviceNames);
      expect(selectDevicePrompt.getCall(0).args[0][0].choices).to.deep.equal(deviceNames);
    });
    it('should return selected device', async () => {
      const selectedDevice = await src.selectDevice(deviceNames);
      expect(selectedDevice).to.be.equal(device);
    });
  });
  describe('askForActionWithDevice', () => {
    const action = 'some action';

    let askForActionPrompt;
    beforeEach(() => {
      askForActionPrompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ action });
    });
    afterEach(() => {
      askForActionPrompt.restore();
    });
    it('should call prompt for action', async () => {
      await src.askForActionWithDevice();
      expect(askForActionPrompt.calledOnce).to.be.true;
    });
    it('should return selected action', async () => {
      const selectedAction = await src.askForActionWithDevice();
      expect(selectedAction).to.be.equal(action);
    });
  });
  describe('connectToDevice', () => {
    const deviceAddress = '58:AF:DE:3B:15:B1';
    const serviceType = ['VNC', 'SSH', null];
    const proxy = 'http://remoteitproxy.io:30664';
    const expirationsec = '1796';
    const expiratonTime = '10 minutes';

    let connect;
    let formatTime;
    let logText;
    let linkFormat;
    beforeEach(() => {
      connect = sinon
        .stub(api, 'deviceConnect')
        .resolves({ proxy, expirationsec });
      formatTime = sinon
        .stub(utils, 'formatExpirationTime')
        .returns(expiratonTime);
      logText = sinon
        .stub(utils.log, 'info');
      linkFormat = sinon
        .stub(utils, 'formatLink');
    });
    afterEach(() => {
      connect.restore();
      formatTime.restore();
      logText.restore();
      linkFormat.restore();
    });
    it('should return notification if device address is missing', async () => {
      const logError = sinon
        .stub(utils.log, 'error');
      await src.connectToDevice();
      logError.restore();
      expect(logError.calledOnce).to.be.true;
    });
    it('should call connect to device with device address', async () => {
      await src.connectToDevice(deviceAddress);
      expect(connect.calledWith(deviceAddress)).to.be.true;
    });
    it('should call function for formating expiration time with expiration sec', async () => {
      await src.connectToDevice(deviceAddress);
      expect(formatTime.calledWith(expirationsec)).to.be.true;
    });
    for (let type of serviceType) {
      it(`should contain expiration time for type ${type}`,
        async () => {
          await src.connectToDevice(deviceAddress, type);
          expect((new RegExp(expiratonTime)).test(logText.getCall(0).args[0])).to.be.true;
        });
      if (type) {
        it(`should call function for link formating for type ${type}`,
          async () => {
            await src.connectToDevice(deviceAddress, type);
            expect(linkFormat.calledOnce).to.be.true;
          });
      }
      if (type !== 'SSH') {
        it(`should contain proxy for type ${type}`,
          async () => {
            await src.connectToDevice(deviceAddress, type);
            expect((new RegExp(proxy)).test(logText.getCall(0).args[0])).to.be.true;
          });
      }
    }
  });
  describe('sendCommandToDevice', () => {
    const command = 'some command';
    const deviceAddress = '58:AF:DE:3B:15:B1';
    const status = 'some status';

    let askForCommandPrompt;
    let sendCommand;
    let logText;
    beforeEach(() => {
      askForCommandPrompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ command });
      sendCommand = sinon
        .stub(api, 'deviceSend')
        .resolves(status);
      logText = sinon
        .stub(utils.log, 'info');
    });
    afterEach(() => {
      askForCommandPrompt.restore();
      sendCommand.restore();
      logText.restore();
    });
    it('should return notification if device address is missing', async () => {
      const logError = sinon.stub(utils.log, 'error');
      await src.sendCommandToDevice();
      logError.restore();
      expect(logError.calledWith(src.ERROR_MISSING_DEVICE_ADDRESS)).to.be.true;
    });
    it('should call prompt for command', async () => {
      await src.sendCommandToDevice(deviceAddress);
      expect(askForCommandPrompt.calledOnce).to.be.true;
    });
    it('should send command to API', async () => {
      await src.sendCommandToDevice(deviceAddress);
      expect(sendCommand.calledWith(deviceAddress, command)).to.be.true;
    });
    it('should log status after command is sent to API', async () => {
      await src.sendCommandToDevice(deviceAddress);
      expect(logText.calledWith(status)).to.be.true;
    });
  });
  describe('workWithDevices', () => {
  });
  describe('main', () => {

  });
});


