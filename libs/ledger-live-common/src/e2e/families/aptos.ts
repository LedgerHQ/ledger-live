import expect from "expect";
import { pressBoth, pressUntilTextFound, waitFor, containsSubstringInEvent } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Delegate } from "../models/Delegate";

export async function sendAptos() {
  await pressUntilTextFound(DeviceLabels.APPROVE);
  await pressBoth();
}

export async function delegateAptos(delegatingAccount: Delegate) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  const events = await pressUntilTextFound(DeviceLabels.APPROVE);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}
