import expect from "expect";
import { Transaction } from "../models/Transaction";
import { waitFor, pressUntilTextFound, containsSubstringInEvent, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Delegate } from "../models/Delegate";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";

export const sendAptos = withDeviceController(({ getDevice }) => async (tx: Transaction) => {
  const buttons = getDevice().buttonFactory();

  await getSendEvents(tx);

  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await buttons.both();
  }
});

export const delegateAptos = withDeviceController(
  ({ getDevice }) =>
    async (delegatingAccount: Delegate) => {
      const buttons = getDevice().buttonFactory();

      await waitFor(DeviceLabels.REVIEW_OPERATION);
      const events = await pressUntilTextFound(DeviceLabels.APPROVE);
      const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
      expect(isAmountCorrect).toBeTruthy();

      await buttons.both();
    },
);
