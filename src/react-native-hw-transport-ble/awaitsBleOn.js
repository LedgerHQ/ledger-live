// @flow

import { verboseLog } from "./debug";
import { BluetoothRequired } from "../errors";
import timer from "../timer";
import type { BleManager } from "./types";

export const awaitsBleOn = (bleManager: BleManager, ms: number = 3000) =>
  new Promise((resolve, reject) => {
    let done = false;
    let lastState = "Unknown";

    const stateSub = bleManager.onStateChange(state => {
      lastState = state;
      if (verboseLog) verboseLog(`ble state -> ${state}`);
      if (state === "PoweredOn") {
        if (done) return;
        removeTimeout();
        done = true;
        stateSub.remove();
        resolve();
      }
    }, true);

    const removeTimeout = timer.timeout(() => {
      if (done) return;
      stateSub.remove();
      reject(new BluetoothRequired("", { state: lastState }));
    }, ms);
  });
