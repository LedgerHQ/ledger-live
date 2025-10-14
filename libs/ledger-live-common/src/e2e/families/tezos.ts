import { getDelegateEvents, getDeviceLabels, pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { Delegate } from "../models/Delegate";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceLabels } from "../enum/DeviceLabels";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { getSpeculosModel } from "../speculosAppVersion";

export async function delegateTezos(delegatingAccount: Delegate) {
  const { delegateConfirmLabel } = getDeviceLabels(delegatingAccount.account.currency.speculosApp);

  await getDelegateEvents(delegatingAccount);
  await pressUntilTextFound(delegateConfirmLabel);
  if (isTouchDevice()) {
    await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }

  if (getSpeculosModel() == DeviceModelId.nanoS) {
    await pressUntilTextFound(DeviceLabels.ACCEPT_AND_SEND);
    await pressBoth();
  }
}
