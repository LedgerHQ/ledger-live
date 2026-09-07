import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import {
  pressUntilTextFound,
  expectSpeculosEventsContain,
  expectMemoTagInEvents,
  getDelegateEvents,
  getSendEvents,
} from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

const UOSMO_MAGNITUDE = 6;

/** The Cosmos app has no display unit for osmo, so it shows raw uosmo (e.g. "10" for 0.00001 OSMO). */
function toUosmo(amount: string): string {
  const [whole, fraction = ""] = amount.split(".");
  const padded = fraction.padEnd(UOSMO_MAGNITUDE, "0").slice(0, UOSMO_MAGNITUDE);
  const digits = `${whole}${padded}`.replace(/^0+/, "");
  return digits === "" ? "0" : digits;
}

export const delegateOsmosis = withDeviceController(
  ({ getButtonsController }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getButtonsController();

      const events = await getDelegateEvents(delegatingAccount);
      expectSpeculosEventsContain(toUosmo(delegatingAccount.amount), events);

      if (isTouchDevice()) {
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);

export const sendOsmosis = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      const events = await getSendEvents(tx);
      expectSpeculosEventsContain(toUosmo(tx.amount), events);

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
