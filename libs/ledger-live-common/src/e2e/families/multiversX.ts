import { getDelegateEvents, pressUntilTextFound } from "../speculos";
import { Delegate } from "../models/Delegate";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export async function delegateMultiversX(delegatingAccount: Delegate) {
  await getDelegateEvents(delegatingAccount);
  if (isTouchDevice()) {
    await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}
