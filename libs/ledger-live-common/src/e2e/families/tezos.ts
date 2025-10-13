import { getDelegateEvents, getDeviceLabels, pressBoth, pressUntilTextFound } from "../speculos";
import { getSpeculosModel } from "../speculosAppVersion";
import { Delegate } from "../models/Delegate";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function delegateTezos(delegatingAccount: Delegate) {
  const { delegateConfirmLabel } = getDeviceLabels(delegatingAccount.account.currency.speculosApp);

  await getDelegateEvents(delegatingAccount);
  await pressUntilTextFound(delegateConfirmLabel);
  await pressBoth();

  if (getSpeculosModel() == DeviceModelId.nanoS) {
    await pressUntilTextFound(DeviceLabels.ACCEPT_AND_SEND);
    await pressBoth();
  }
}
