import expect from "expect";
import { waitFor, containsSubstringInEvent, pressUntilTextFound, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Delegate } from "../models/Delegate";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { Transaction } from "../models/Transaction";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendKaspa = withDeviceController(
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

export const delegateKaspa = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      await waitFor(DeviceLabels.REVIEW_OPERATION);
      const events = await pressUntilTextFound(DeviceLabels.APPROVE);
      const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
      expect(isAmountCorrect).toBeTruthy();

      await buttons.both();
    },
);
