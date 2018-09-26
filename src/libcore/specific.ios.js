// @flow

import { NativeModules } from "react-native";

// NB ideally all the specific.*.js code MUST be gone!
// Please use this file to contain all the libcore Platform specific code

export const createInstance = (factory: *, ...params: *) =>
  // TODO check that .new is gone and newInstance are all available
  {
    const newInstance =
      factory.new || factory.newInstance || factory.newInstace;
    return newInstance.call(factory, ...params);
  };

export const getNativeModule = (name: string) => NativeModules[`CoreLG${name}`];

// FIXME we should drop this need!
export const getValue = (obj: any) => obj.value;

export const OperationTypeMap = {
  "0": "OUT",
  "1": "IN",
};

export const getBlockHeightForAccount = async (core: *, coreAccount: *) => {
  const coreBlock = await core.coreAccount.getLastBlock(coreAccount);
  const blockHeightRes = await core.coreBlock.getHeight(coreBlock);
  return blockHeightRes.value;
};

// on iOS, dateR.value is just null !
export const getOperationDate = async (core: *, coreOperation: *) => {
  const dateR = await core.coreOperation.getDate(coreOperation);
  return new Date(dateR.value);
};
