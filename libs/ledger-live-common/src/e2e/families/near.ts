import expect from "expect";
import { Delegate } from "../models/Delegate";
import {
  waitFor,
  containsSubstringInEvent,
  getDelegateEvents,
  pressUntilTextFound,
} from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease, pressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function delegateNear(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
  expect(isProviderCorrect).toBeTruthy();
  if (getSpeculosModel() === DeviceModelId.stax) {
    await pressAndRelease(DeviceLabels.CONFIRM_HEADER);
    await waitFor(DeviceLabels.VIEW_ACTION);
    await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
    await waitFor(DeviceLabels.VIEW_ACTION);
    await pressUntilTextFound(DeviceLabels.SIGN);
    await pressBoth();
  }
}
