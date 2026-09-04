import { expectSpeculosEventsContain, getDelegateEvents, pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { Delegate } from "../models/Delegate";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateCelo = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      expectSpeculosEventsContain(delegatingAccount.amount, events);

      if (isTouchDevice()) {
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
