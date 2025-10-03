import { Delegate } from "../models/Delegate";
import { pressUntilTextFound, containsSubstringInEvent, getDelegateEvents } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import expect from "expect";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function delegateOsmosis(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const amountInUosmo = (Number(delegatingAccount.amount) * 1_000_000).toString();
  const isAmountCorrect = containsSubstringInEvent(amountInUosmo, events);
  expect(isAmountCorrect).toBeTruthy();
  if (getSpeculosModel() === DeviceModelId.stax) {
    await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN.name);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
