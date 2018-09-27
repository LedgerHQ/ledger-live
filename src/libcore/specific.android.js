// @flow

import { NativeModules } from "react-native";

// NB ideally all the specific.*.js code MUST be gone!
// Please use this file to contain all the libcore Platform specific code

export const createInstance = (factory: *, ...params: *) =>
  factory.newInstance.call(factory, ...params);

export const getNativeModule = (name: string) => NativeModules[`Core${name}`];

export const getValue = (obj: any) => obj;

export const OperationTypeMap = {
  SEND: "OUT",
  RECEIVE: "IN",
};

/* eslint-disable */
export const getBlockHeightForAccount = async (core: *, coreAccount: *) => {
  const coreBlock = await core.coreAccount.getLastBlock(coreAccount);
  const blockHeightRes = await core.coreBlock.getHeight(coreBlock);
  return blockHeightRes;
};

/* eslint-disable */
export const getOperationDate = async (core: *, coreOperation: *) => {
  const dateR = await core.coreOperation.getDate(coreOperation);
  return new Date(dateR.value);
};
