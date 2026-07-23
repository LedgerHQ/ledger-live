import { getDelegateEvents, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { Transaction } from "../models/Transaction";
import { Delegate } from "../models/Delegate";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendSui = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      await getSendEvents(tx);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);

export const delegateSui = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      await getDelegateEvents(delegatingAccount);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
