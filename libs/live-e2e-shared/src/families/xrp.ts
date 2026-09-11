import { Transaction } from "../models/Transaction";
import { expectSpeculosEventsContain, expectMemoTagInEvents, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendXRP = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await getSendEvents(tx);
      expectSpeculosEventsContain(tx.amount, events);
      if (!tx.accountToCredit.address) {
        throw new Error("Recipient address is not set");
      }
      expectSpeculosEventsContain(tx.accountToCredit.address, events);
      expectMemoTagInEvents(tx, events);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
