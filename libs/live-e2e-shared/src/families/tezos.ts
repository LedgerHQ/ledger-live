import {
  expectSpeculosEventsContain,
  getDelegateEvents,
  pressUntilTextFound,
  waitFor,
} from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { Delegate } from "../models/Delegate";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateTezos = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      // Stake/unstake reviews show the amount on-device; a pure delegation (amount "N/A") shows the
      // baker address + fee but no amount, so only assert when an amount is expected.
      if (delegatingAccount.amount !== "N/A") {
        expectSpeculosEventsContain(delegatingAccount.amount, events);
      }

      if (isTouchDevice()) {
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
        return;
      }

      // Tezos 3.0.6 on the Nano S cannot parse a reveal batched with a delegation.
      const fellBackToBlindSigning = (await waitFor(DeviceLabels.ACCEPT)).includes(
        DeviceLabels.ACCEPT_RISK,
      );
      await buttons.both();
      if (fellBackToBlindSigning) {
        await pressUntilTextFound(DeviceLabels.ACCEPT_AND_SEND);
        await buttons.both();
      }
    },
);
