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
  // FIXME: this is throwing
  // `Cannot convert argument of type class java.lang.Long`
  /*
    const coreBlock = await core.coreAccount.getLastBlock(coreAccount);
    const blockHeightRes = await core.coreBlock.getHeight(coreBlock);
    return blockHeightRes.value;
  */
  return 0;
};

// FIXME: libcore is sending date without timezone, and with weird
//        format (e.g: `2018-59-31 03:59:53`)
export const getOperationDate = async (core, coreOperation) => {
  const _dateR = await core.coreOperation.getDate(coreOperation);
  return new Date();
  //return new Date(dateR.value);
};
