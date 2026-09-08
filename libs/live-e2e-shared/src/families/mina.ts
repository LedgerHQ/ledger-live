import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import { expectSpeculosEventsContain, getDelegateEvents, getSendEvents } from "../speculos";
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
      expectSpeculosEventsContain(tx.accountToCredit.address, events);

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
      // The Mina app renders the raw B62 recipient address, never the provider name: the
      // destination validator's for a delegation, the account's own for an undelegation.
      if (delegatingAccount.account.currency.id === Currency.MINA.id) {
        const expectedAddress =
          delegatingAccount.validatorAddress ?? delegatingAccount.account.address;
        if (!expectedAddress) {
          throw new Error(
            "Mina delegation target address is not set: pass Delegate.validatorAddress for a " +
              "new delegation, or populate Delegate.account.address (liveDataWithAddressCommand) " +
              "for an undelegation.",
          );
        }
        expectSpeculosEventsContain(expectedAddress, events);
      } else {
        expectSpeculosEventsContain(delegatingAccount.provider, events);
      }

      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);
