import { getDelegateEvents, getSendEvents, expectSpeculosEventsContain } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { Transaction } from "../models/Transaction";
import { Delegate } from "../models/Delegate";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const delegateSolana = withDeviceController(
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

export const sendSolana = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await getSendEvents(tx);
      expectSpeculosEventsContain(tx.amount, events);

      const isSplToken = !!tx.accountToCredit.currency.contractAddress;
      if (!isSplToken && process.env.SPECULOS_DEVICE !== Device.LNS.name) {
        if (!tx.accountToCredit.address) {
          throw new Error("Recipient address is not set");
        }
        expectSpeculosEventsContain(tx.accountToCredit.address, events);
      }

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
