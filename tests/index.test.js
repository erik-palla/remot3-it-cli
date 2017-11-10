import { expect } from 'chai';
import sinon from 'sinon';

import * as index from '../src/index';
import * as cli from '../src/cli';

describe('INDEX', () => {
  describe('main', () => {
    const devices = 'some devices';

    let authorization;
    let listDevices;
    let workWithDevices;
    beforeEach(() => {
      authorization = sinon
        .stub(cli, 'authorization');
      listDevices = sinon
        .stub(cli, 'listAllRegisteredDevices')
        .resolves(devices);
      workWithDevices = sinon
        .stub(cli, 'workWithDevices')
    });

    afterEach(() => {
      authorization.restore();
      listDevices.restore();
      workWithDevices.restore();
    });

    it('should ask for autorization', async () => {
      await index.main();
      expect(authorization.called).to.be.true;
    });
    it('should list registered devices', async () => {
      await index.main();
      expect(listDevices.called).to.be.true;
    });
    it('should start work with devices by passing registered devices', async () => {
      await index.main();
      expect(workWithDevices.calledWith(devices)).to.be.true;
    });
  });
});


