import { getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { Transaction } from "../models/Transaction";

export async function sendSui(tx: Transaction) {
  await getSendEvents(tx);
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
