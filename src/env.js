// @flow
// set and get environment & config variables

const env = {};

export const setEnv = (name: string, value: any) => {
  env[name] = value;
};

export const getEnv = (name: string) => env[name];
