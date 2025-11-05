import expect from "expect";
import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, getDelegateEvents, getSendEvents } from "../speculos";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export async function delegateCosmos(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}

export async function sendCosmos(tx: Transaction) {
  const events = await getSendEvents(tx);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
