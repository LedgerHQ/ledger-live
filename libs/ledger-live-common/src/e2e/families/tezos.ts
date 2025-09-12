import { getDelegateEvents, getSpeculosModel, pressBoth, pressUntilTextFound } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Delegate } from "../models/Delegate";
import { DeviceModelId } from "@ledgerhq/types-devices";

export async function delegateTezos(delegatingAccount: Delegate) {
  await getDelegateEvents(delegatingAccount);
  await pressBoth();

  if (getSpeculosModel() !== DeviceModelId.nanoS) {
    await pressUntilTextFound(DeviceLabels.ACCEPT);
    await pressBoth();
  }
}
