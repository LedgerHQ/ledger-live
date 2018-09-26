// @flow

import { NativeModules } from "react-native";

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
