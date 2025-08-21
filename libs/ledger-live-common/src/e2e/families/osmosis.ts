import { Delegate } from "../models/Delegate";
import { containsSubstringInEvent, pressBoth, pressUntilTextFound, waitFor } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import expect from "expect";

export async function delegateOsmosis(delegatingAccount: Delegate) {
  await waitFor(DeviceLabels.PLEASE_REVIEW);
  const events = await pressUntilTextFound(DeviceLabels.CAPS_APPROVE);
  const amountInUosmo = (Number(delegatingAccount.amount) * 1_000_000).toString();
  const isAmountCorrect = containsSubstringInEvent(amountInUosmo, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}
