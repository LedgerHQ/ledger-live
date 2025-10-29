import expect from "expect";
import { waitFor, containsSubstringInEvent, pressUntilTextFound, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Delegate } from "../models/Delegate";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { Transaction } from "../models/Transaction";

export async function sendKaspa(tx: Transaction) {
  await getSendEvents(tx);
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}

export async function delegateKaspa(delegatingAccount: Delegate) {
  await waitFor(DeviceLabels.REVIEW_OPERATION);
  const events = await pressUntilTextFound(DeviceLabels.APPROVE);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}
