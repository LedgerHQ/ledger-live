import expect from "expect";
import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, getSendEvents } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function sendPolkadot(tx: Transaction) {
  const events = await getSendEvents(tx);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  if (getSpeculosModel() === DeviceModelId.stax) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
