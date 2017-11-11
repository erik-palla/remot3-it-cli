import { expect } from 'chai';
import sinon from 'sinon';
import * as api from 'remot3-it-api';
import ncp from 'copy-paste';

import * as cli from '../src/cli';
import * as utils from '../src/utils';
import * as prompts from '../src/prompts';
import deviceListJson from './mocks/devicelist.json';

describe('CLI  ', () => {
  describe('authorization', () => {
    const username = 'username';
    const password = 'password';
    let prompt;
    let logUser;
    beforeEach(() => {
      prompt = sinon
        .stub(prompts, 'askForCredentials')
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
      await cli.authorization();
      expect(prompt.called).to.be.true;
    });
    it('should log user into API', async () => {
      await cli.authorization();
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
      await cli.listAllRegisteredDevices();
      expect(listDevices.called).to.be.true;
    });
    it('should return notification if there is no device', async () => {
      listDevices.resolves([]);
      await cli.listAllRegisteredDevices();
      expect(logError.calledWith(cli.ERROR_NO_REGISTERED_DEVICES)).to.be.true;
    });
    it('should call function for formating device names', async () => {
      listDevices.resolves(deviceListJson);
      const formatNames = sinon.spy(utils, 'formatDeviceNames');
      await cli.listAllRegisteredDevices();
      formatNames.restore();
      expect(formatNames.calledOnce).to.be.true;
    });
    it('should return devices details', async () => {
      listDevices.resolves(deviceListJson);
      const devices = await cli.listAllRegisteredDevices();
      expect(devices.details).to.deep.equal(deviceListJson);
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
    let copyLink;
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
      copyLink = sinon
        .stub(ncp, 'copy');
    });
    afterEach(() => {
      connect.restore();
      formatTime.restore();
      logText.restore();
      linkFormat.restore();
      copyLink.restore();
    });
    it('should return notification if device address is missing', async () => {
      const logError = sinon
        .stub(utils.log, 'error');
      await cli.connectToDevice();
      logError.restore();
      expect(logError.calledOnce).to.be.true;
    });
    it('should call connect to device with device address', async () => {
      await cli.connectToDevice(deviceAddress);
      expect(connect.calledWith(deviceAddress)).to.be.true;
    });
    it('should call function for formating expiration time with expiration sec', async () => {
      await cli.connectToDevice(deviceAddress);
      expect(formatTime.calledWith(expirationsec)).to.be.true;
    });
    it('should call function for copying link to OS clipboard', async () => {
      const link = 'some link';
      linkFormat.returns(link);
      await cli.connectToDevice(deviceAddress);

      expect(copyLink.calledWith(link)).to.be.true;
    })
    for (let type of serviceType) {
      it(`should contain expiration time for type ${type}`,
        async () => {
          await cli.connectToDevice(deviceAddress, type);
          expect((new RegExp(expiratonTime)).test(logText.getCall(0).args[0])).to.be.true;
        });
      if (type) {
        it(`should call function for link formating for type ${type}`,
          async () => {
            await cli.connectToDevice(deviceAddress, type);
            expect(linkFormat.calledOnce).to.be.true;
          });
      }
      if (type !== 'SSH') {
        it(`should contain proxy for type ${type}`,
          async () => {
            await cli.connectToDevice(deviceAddress, type);
            expect((new RegExp(proxy)).test(logText.getCall(0).args[0])).to.be.true;
          });
      }
    }
  });
  describe('sendCommandToDevice', () => {
    const command = 'some command';
    const deviceAddress = '58:AF:DE:3B:15:B1';
    const status = 'some status';

    let prompt;
    let sendCommand;
    let logText;
    beforeEach(() => {
      prompt = sinon
        .stub(prompts, 'askForCommand')
        .resolves(command);
      sendCommand = sinon
        .stub(api, 'deviceSend')
        .resolves(status);
      logText = sinon
        .stub(utils.log, 'info');
    });
    afterEach(() => {
      prompt.restore();
      sendCommand.restore();
      logText.restore();
    });
    it('should return notification if device address is missing', async () => {
      const logError = sinon.stub(utils.log, 'error');
      await cli.sendCommandToDevice();
      logError.restore();
      expect(logError.calledWith(cli.ERROR_MISSING_DEVICE_ADDRESS)).to.be.true;
    });
    it('should call prompt for command', async () => {
      await cli.sendCommandToDevice(deviceAddress);
      expect(prompt.calledOnce).to.be.true;
    });
    it('should send command to API', async () => {
      await cli.sendCommandToDevice(deviceAddress);
      expect(sendCommand.calledWith(deviceAddress, command)).to.be.true;
    });
    it('should log status after command is sent to API', async () => {
      await cli.sendCommandToDevice(deviceAddress);
      expect(logText.calledWith(status)).to.be.true;
    });
  });
  describe('workWithDevices', () => {
    const deviceList = JSON.parse(JSON.stringify(deviceListJson));
    const devices = { names: [{ value: 'device name' }], details: deviceList };
    const device = deviceList[1].devicealias;

    let promptDeviceSelection;
    let promptActionWithDevice;
    let terminateApp;
    beforeEach(() => {
      promptDeviceSelection = sinon
        .stub(prompts, 'askForDeviceSelection')
        .resolves(device);
      promptActionWithDevice = sinon
        .stub(prompts, 'askForActionWithDevice')
      terminateApp = sinon
        .stub(utils, 'terminateApp');
    });
    afterEach(() => {
      promptDeviceSelection.restore();
      promptActionWithDevice.restore();
      terminateApp.restore();
    });

    it('should return notification if there is no device', async () => {
      const logError = sinon.stub(utils.log, 'error');
      await cli.workWithDevices();
      logError.restore();
      expect(logError.calledWith(cli.ERROR_NO_REGISTERED_DEVICES)).to.be.true;
    });
    it('should call prompt for device selection', async () => {
      await cli.workWithDevices(devices);
      expect(promptDeviceSelection.calledOnce).to.be.true;
    });
    it('should call prompt for device selection with device names', async () => {
      await cli.workWithDevices(devices);
      expect(promptDeviceSelection.getCall(0).args[0]).to.deep.equal(devices.names);
    });
    it('should return notification if selected device have no address', async () => {
      const alteredDeviceList = JSON.parse(JSON.stringify(deviceListJson));
      const deviceDetailsWithoutAddress = alteredDeviceList
        .map(d => Object.assign(d, { deviceaddress: undefined }));
      const devicesWithoutAddress = { names: [{}], details: deviceDetailsWithoutAddress };
      const logError = sinon.stub(utils.log, 'error');

      await cli.workWithDevices(devicesWithoutAddress);
      logError.restore();
      expect(logError.calledWith(cli.ERROR_MISSING_DEVICE_ADDRESS)).to.be.true;
    });
    it('should call askForActionWithDevice function', async () => {
      await cli.workWithDevices(devices);
      expect(promptActionWithDevice.calledOnce).to.be.true;
    });
    it('should call connectToDevice function if action "Connect to device" selected', async () => {
      const connectToDevice = sinon.stub(cli, 'connectToDevice');

      promptActionWithDevice
        .onCall(0).resolves('Connect to device')
        .onCall(1).resolves('Exit');

      await cli.workWithDevices(devices);
      connectToDevice.restore();
      expect(connectToDevice.called).to.be.true;
    });
    it('should call workWithDevices function if action "Connect to device" selected', async () => {
      const connectToDevice = sinon.stub(cli, 'connectToDevice');
      const workWithDevicesSpy = sinon.spy(cli, 'workWithDevices');

      promptActionWithDevice
        .onCall(0).resolves('Connect to device')
        .onCall(1).resolves('Exit');

      await cli.workWithDevices(devices);

      connectToDevice.restore();
      workWithDevicesSpy.restore();
      expect(workWithDevicesSpy.called).to.be.true;
    });
    it('should call workWithDevices function if action "Return back" selected', async () => {
      const workWithDevicesSpy = sinon.spy(cli, 'workWithDevices');

      promptActionWithDevice
        .onCall(0).resolves('Return back')
        .onCall(1).resolves('Exit');

      await cli.workWithDevices(devices);

      workWithDevicesSpy.restore();
      expect(workWithDevicesSpy.called).to.be.true;
    });
    it('should call process exit function if action "Exit" called', async () => {
      promptActionWithDevice.resolves('Exit');
      await cli.workWithDevices(devices);
      expect(terminateApp.calledOnce).to.be.true;
    });
  });
});


