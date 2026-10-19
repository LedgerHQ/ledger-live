import { DeviceModelId } from "@ledgerhq/devices";
import { Delegate } from "../models/Delegate";
import {
  expectSpeculosEventsContain,
  getDelegateEvents,
  pressUntilTextFound,
  waitFor,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateNear = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      expectSpeculosEventsContain(delegatingAccount.provider, events);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
        return;
      }

      await buttons.both();
      // The Nano S is frozen on NEAR 2.2.0, older than the 2.5.0 review flow: its review shows the
      // header, then "Continue to actions" opens the actions, which end on "Sign".
      if (getSpeculosModel() === DeviceModelId.nanoS) {
        await waitFor(DeviceLabels.VIEW_ACTION);
        await pressUntilTextFound(DeviceLabels.SIGN);
        await buttons.both();
      }
    },
);
