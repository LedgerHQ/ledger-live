import { containsSubstringInEvent, getDelegateEvents, pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { Delegate } from "../models/Delegate";
import expect from "expect";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function delegateCelo(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (isTouchDevice()) {
    await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
