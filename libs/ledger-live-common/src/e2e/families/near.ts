import expect from "expect";
import { Delegate } from "../models/Delegate";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
  getDelegateEvents,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function delegateNear(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
  expect(isProviderCorrect).toBeTruthy();
  await pressBoth();
  await waitFor(DeviceLabels.VIEW_ACTION);
  await pressUntilTextFound(DeviceLabels.SIGN);
  await pressBoth();
}
