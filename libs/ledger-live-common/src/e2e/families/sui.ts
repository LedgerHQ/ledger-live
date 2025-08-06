import expect from "expect";
import { pressBoth, pressUntilTextFound, waitFor, containsSubstringInEvent } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Delegate } from "../models/Delegate";

export async function sendSui() {
  await pressUntilTextFound(DeviceLabels.APPROVE);
  await pressBoth();
}

export async function delegateSui(delegatingAccount: Delegate) {
  await waitFor(DeviceLabels.REVIEW_OPERATION);
  const events = await pressUntilTextFound(DeviceLabels.APPROVE);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}
