import expect from "expect";
import { Delegate } from "../models/Delegate";
import { containsSubstringInEvent, getDelegateEvents } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateMina = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
      expect(isProviderCorrect).toBeTruthy();

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
