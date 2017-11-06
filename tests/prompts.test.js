import { expect } from 'chai';
import sinon from 'sinon';
import inquirer from 'inquirer';

import * as prompts from '../src/prompts';

describe('PROMPTS', () => {
  describe('askForCredentials', () => {
    const username = 'username';
    const password = 'password';

    let prompt;
    beforeEach(() => {
      prompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ username, password });
    });
    afterEach(() => {
      prompt.restore();
    });
    it('should call prompt for action', async () => {
      await prompts.askForCredentials();
      expect(prompt.calledOnce).to.be.true;
    });
    it('should return inserted credentials', async () => {
      const credentials = await prompts.askForCredentials();
      expect(credentials.username).to.be.equal(username);
      expect(credentials.password).to.be.equal(password);
    });
  });
  describe('askForDeviceSelection', () => {
    const device = 'some device';
    const deviceNames = [
      { name: '[SSH] SSH-device', value: 'SSH-device', disabled: false }
    ];

    let prompt;
    beforeEach(() => {
      prompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ device });
    });
    afterEach(() => {
      prompt.restore();
    });
    it('should call prompt for device selection', async () => {
      await prompts.askForDeviceSelection(deviceNames);
      expect(prompt.calledOnce).to.be.true;
    });
    it('should be called with device names', async () => {
      await prompts.askForDeviceSelection(deviceNames);
      expect(prompt.getCall(0).args[0][0].choices).to.deep.equal(deviceNames);
    });
    it('should return selected device', async () => {
      const selectedDevice = await prompts.askForDeviceSelection(deviceNames);
      expect(selectedDevice).to.be.equal(device);
    });
  });
  describe('askForActionWithDevice', () => {
    const action = 'some action';

    let prompt;
    beforeEach(() => {
      prompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ action });
    });
    afterEach(() => {
      prompt.restore();
    });
    it('should call prompt for action', async () => {
      await prompts.askForActionWithDevice();
      expect(prompt.calledOnce).to.be.true;
    });
    it('should return selected action', async () => {
      const selectedAction = await prompts.askForActionWithDevice();
      expect(selectedAction).to.be.equal(action);
    });
  });
  describe('askForCommand', () => {
    const command = 'some command';

    let prompt;
    beforeEach(() => {
      prompt = sinon
        .stub(inquirer, 'prompt')
        .resolves({ command });
    });
    afterEach(() => {
      prompt.restore();
    });
    it('should call prompt for command', async () => {
      await prompts.askForCommand();
      expect(prompt.calledOnce).to.be.true;
    });
    it('should return inserted command', async () => {
      const insertedCommand = await prompts.askForCommand();
      expect(insertedCommand).to.be.equal(command);
    });
  });
})



