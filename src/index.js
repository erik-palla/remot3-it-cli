#!/usr/bin/env node
import { authorization, listAllRegisteredDevices, workWithDevices } from './cli';

/**
 * Ask user for credentials, set header for further authorization and ask for all registered
 * devices
 * 
 */
export const main = async () => {
  await authorization();
  const devices = await listAllRegisteredDevices();
  workWithDevices(devices);
};
main();