import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import {
  expectSpeculosEventsContain,
  expectMemoTagInEvents,
  getDelegateEvents,
  getSendEvents,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateCosmos = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      expectSpeculosEventsContain(delegatingAccount.amount, events);

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);

export const sendCosmos = withDeviceController(
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
