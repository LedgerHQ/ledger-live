import expect from "expect";
import { Transaction } from "../models/Transaction";
import { waitFor, containsSubstringInEvent, pressUntilTextFound, getSendEvents } from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendBTCBasedCoin = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await getSendEvents(tx);
      const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
      expect(isAmountCorrect).toBeTruthy();

      const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
      expect(isAddressCorrect).toBeTruthy();

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
        await waitFor(DeviceLabels.CONFIRM);
        await pressUntilTextFound(DeviceLabels.ACCEPT);
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
        const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
        expect(isAmountCorrect).toBeTruthy();

        const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
        expect(isAddressCorrect).toBeTruthy();

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
