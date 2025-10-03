import { getSendEvents } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Transaction } from "../models/Transaction";

export async function sendSui(tx: Transaction) {
  await getSendEvents(tx);
  if (getSpeculosModel() === DeviceModelId.stax) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
