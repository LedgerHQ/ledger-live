// @flow

import { NativeModules } from "react-native";

export const createInstance = (factory: *, ...params: *) =>
  factory.newInstance.call(factory, ...params);

export const getNativeModule = (name: string) => NativeModules[`Core${name}`];

export const getValue = (obj: any) => obj;

export const OperationTypeMap = {
  SEND: "OUT",
  RECEIVE: "IN",
};
