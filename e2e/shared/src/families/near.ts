import expect from "expect";
import { Delegate } from "../models/Delegate";
import {
  waitFor,
  containsSubstringInEvent,
  getDelegateEvents,
  pressUntilTextFound,
} from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease, pressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateNear = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
      expect(isProviderCorrect).toBeTruthy();

      if (isTouchDevice()) {
        await pressAndRelease(DeviceLabels.CONFIRM_HEADER);
        await waitFor(DeviceLabels.VIEW_ACTION);
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
        await waitFor(DeviceLabels.VIEW_ACTION);
        await pressUntilTextFound(DeviceLabels.SIGN);
        await buttons.both();
      }
    },
);
