#!/usr/bin/env node
import { authorization, listAllRegisteredDevices, workWithDevices } from './cli';

export const main = async () => {
  await authorization();
  const devices = await listAllRegisteredDevices();
  workWithDevices(devices);
};
main();