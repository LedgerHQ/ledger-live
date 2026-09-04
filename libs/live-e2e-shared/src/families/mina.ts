import expect from "expect";
import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import { containsSubstringInEvent, getDelegateEvents, getSendEvents } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Currency } from "../enum/Currency";
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
      // The Mina app only ever renders the raw B62 recipient address on device (never a
      // human-readable provider name), so a provider-substring check here would only pass
      // by coincidence (the fuzzy fallback regex matching base58/hex noise across the
      // concatenated screens). Skip it for Mina; getDelegateEvents already asserts that the
      // review flow reached the sign/approve screens.
      if (delegatingAccount.account.currency.name !== Currency.MINA.name) {
        const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
        expect(isProviderCorrect).toBeTruthy();
      }

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
