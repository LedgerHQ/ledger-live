import { Transaction } from "../models/Transaction";
import {
  waitFor,
  expectSpeculosEventsContain,
  pressUntilTextFound,
  getSendEvents,
  waitForSendReviewTransaction,
} from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { Currency } from "../enum/Currency";

const getSignTransactionLabel = (currencyId: string): string => {
  switch (currencyId) {
    case Currency.ZEC.id:
      return DeviceLabels.SIGN_TRANSACTION;
    default:
      return DeviceLabels.ACCEPT;
  }
};

export const sendBTCBasedCoin = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction, currencyId: string) => {
      if (!tx.accountToCredit.address) {
        throw new Error("Recipient address is not set");
      }

      const buttons = getButtonsController();

      await waitForSendReviewTransaction(tx);

      if (isTouchDevice()) {
        const events = await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        expectSpeculosEventsContain(tx.amount, events);
        expectSpeculosEventsContain(tx.accountToCredit.address, events);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        const amountStep = await pressUntilTextFound(DeviceLabels.AMOUNT);
        expectSpeculosEventsContain(tx.amount, amountStep);

        const addressStep = await pressUntilTextFound(DeviceLabels.ADDRESS);
        expectSpeculosEventsContain(tx.accountToCredit.address, addressStep);

        await pressUntilTextFound(getSignTransactionLabel(currencyId));
        if (currencyId !== Currency.ZEC.id) {
          await buttons.both();
          await waitFor(DeviceLabels.CONFIRM);
          await pressUntilTextFound(DeviceLabels.ACCEPT);
        }
        await buttons.both();
      }
    },
);

export const sendBTC = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();
      const speculosDevice = getSpeculosModel();

      try {
        const events = await getSendEvents(tx);
        expectSpeculosEventsContain(tx.amount, events);

        if (!tx.accountToCredit.address) {
          throw new Error("Recipient address is not set");
        }
        expectSpeculosEventsContain(tx.accountToCredit.address, events);

        if (isTouchDevice()) {
          await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
        } else {
          await buttons.both();
          if (speculosDevice === DeviceModelId.nanoS) {
            await pressUntilTextFound(DeviceLabels.SIGN);
            await buttons.both();
            await waitFor(DeviceLabels.BITCOIN_IS_READY);
          } else {
            await waitFor(DeviceLabels.TRANSACTION_SIGNED);
          }
        }
      } catch (e) {
        invariant(false, `Error while sending BTC transaction: ${e}`);
      }
    },
);
