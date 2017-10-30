import { expect } from 'chai';
import sinon from 'sinon';

import inquirer from 'inquirer';
import * as api from 'remot3-it-api';

import {
  authorization
} from '../src';

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
        console.log(error);
      }
    });
    it('should log user into API', async () => {
      try {
        await authorization();
        expect(logUser.calledWith(username, password)).to.be.true;
      } catch (error) {
        console.log(error);
      }
    });
  })
  describe('listAllRegisteredDevices', () => {

  })

})
