import { BluetoothRequired } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import timer from "./timer";
import type { BleManager } from "./types";
export const awaitsBleOn = (bleManager: BleManager, ms = 3000): Promise<void> =>
  new Promise((resolve, reject) => {
    let done = false;
    let lastState = "Unknown";
    const stateSub = bleManager.onStateChange((state) => {
      lastState = state;
      log("ble-verbose", `ble state -> ${state}`);

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
      reject(
        new BluetoothRequired("", {
          state: lastState,
        })
      );
    }, ms);
  });
