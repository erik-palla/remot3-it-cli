import inquirer from 'inquirer';

export const askForCredentials = async () => {
  const forCredentials = [
    {
      type: 'input',
      message: 'Enter a username',
      name: 'username',
    },
    {
      type: 'password',
      message: 'Enter password',
      name: 'password',
      mask: '*',
    },
  ];
  const credentials = await inquirer.prompt(forCredentials);
  return credentials;
}

export const askForDeviceSelection = async (deviceNames) => {
  const forDevice = [
    {
      type: 'list',
      name: 'device',
      message: 'Select device',
      choices: deviceNames,
    },
  ];
  const { device } = await inquirer.prompt(forDevice);
  return device;
};

export const askForActionWithDevice = async () => {
  const forAction = [{
    type: 'list',
    name: 'action',
    message: 'Select action',
    choices: [
      // 'Send command', 
      'Connect to device',
      new inquirer.Separator(),
      'Return back',
      'Exit'
    ],
  }];
  const { action } = await inquirer.prompt(forAction);
  return action;
};

export const askForCommand = async () => {
  const forCommand = {
    type: 'input',
    name: 'command',
    message: 'Specify command'
  }
  const { command } = await inquirer.prompt(forCommand);
  return command;
}