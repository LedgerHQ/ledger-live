import expect from "expect";
import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendAlgorand = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await getSendEvents(tx);
      const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
      expect(isAmountCorrect).toBeTruthy();

      if (!tx.accountToCredit.address) {
        throw new Error("Recipient address is not set");
      }
      const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
      expect(isAddressCorrect).toBeTruthy();

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
