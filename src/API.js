// @flow

import { NativeModules, NativeEventEmitter } from "react-native";

let getTransactions;

if (NativeModules.LGApi) {
  // TMP for the early POC demo version
  const txEventEmitter = new NativeEventEmitter(NativeModules.LGApi);
  NativeModules.LGApi.makeApi();
  getTransactions = (address: string): Promise<*> =>
    new Promise(success => {
      const sub = txEventEmitter.addListener("TransactionsReceived", res => {
        success(res);
        sub.remove();
      });
      NativeModules.LGApi.getTransactions(address);
    });
} else {
  getTransactions = (_: string) => Promise.resolve([]);
}

export { getTransactions };
