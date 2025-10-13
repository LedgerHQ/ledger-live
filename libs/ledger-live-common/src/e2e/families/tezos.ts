import { getDelegateEvents, getDeviceLabels, pressUntilTextFound } from "../speculos";
import { isTouchDevice, getSpeculosModel } from "../speculosAppVersion";
import { Delegate } from "../models/Delegate";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateTezos = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const { delegateConfirmLabel } = getDeviceLabels(
        delegatingAccount.account.currency.speculosApp,
      );

      await getDelegateEvents(delegatingAccount);
      await pressUntilTextFound(delegateConfirmLabel);

      if (isTouchDevice()) {
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }

      if (getSpeculosModel() === DeviceModelId.nanoS) {
        await pressUntilTextFound(DeviceLabels.ACCEPT_AND_SEND);
        await buttons.both();
      }
    },
);
