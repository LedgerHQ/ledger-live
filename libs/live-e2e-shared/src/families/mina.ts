import expect from "expect";
import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, getDelegateEvents, getSendEvents } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendMina = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await getSendEvents(tx);
      if (!tx.accountToCredit.address) {
        throw new Error("Recipient address is not set");
      }
      const isRecipientCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
      expect(isRecipientCorrect).toBeTruthy();

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);

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
