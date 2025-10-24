import expect from "expect";
import { containsSubstringInEvent, getDelegateEvents, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { Transaction } from "../models/Transaction";
import { Delegate } from "../models/Delegate";

export async function delegateSolana(delegatingAccount: Delegate) {
  await getDelegateEvents(delegatingAccount);
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}

export async function sendSolana(tx: Transaction) {
  const events = await getSendEvents(tx);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }

  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
