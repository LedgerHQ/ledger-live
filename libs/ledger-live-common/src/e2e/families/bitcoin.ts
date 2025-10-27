import expect from "expect";
import { Transaction } from "../models/Transaction";
import { waitFor, containsSubstringInEvent, pressUntilTextFound, getSendEvents } from "../speculos";
import { getSpeculosModel, isTouchDevice } from "../speculosAppVersion";
import { pressBoth } from "../deviceInteraction/ButtonDeviceSimulator";
import { DeviceLabels } from "../enum/DeviceLabels";
import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";

export async function sendBTCBasedCoin(tx: Transaction) {
  const events = await getSendEvents(tx);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
    await waitFor(DeviceLabels.CONFIRM);
    await pressUntilTextFound(DeviceLabels.ACCEPT);
    await pressBoth();
  }
}

export async function sendBTC(tx: Transaction) {
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
      await pressBoth();
      if (speculosDevice === DeviceModelId.nanoS) {
        await pressUntilTextFound(DeviceLabels.SIGN);
        await pressBoth();
        await waitFor(DeviceLabels.BITCOIN_IS_READY);
      } else {
        await waitFor(DeviceLabels.TRANSACTION_SIGNED);
      }
    }
  } catch (e) {
    invariant(false, `Error while sending BTC transaction: ${e}`);
  }
}
