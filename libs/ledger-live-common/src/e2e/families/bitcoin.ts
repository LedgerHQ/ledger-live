import expect from "expect";
import { Transaction } from "../models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
  getSpeculosModel,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import invariant from "invariant";

export async function sendBTCBasedCoin(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressUntilTextFound(DeviceLabels.ACCEPT);
  await pressBoth();
}

export async function sendBTC(tx: Transaction) {
  const speculosDevice = getSpeculosModel();
  try {
    const events =
      speculosDevice === Device.LNS
        ? await pressUntilTextFound(DeviceLabels.CONTINUE)
        : await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
    const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
    await pressBoth();
    if (speculosDevice === Device.LNS) {
      await pressUntilTextFound(DeviceLabels.SIGN);
      await pressBoth();
      await waitFor(DeviceLabels.BITCOIN_IS_READY);
    } else {
      await waitFor(DeviceLabels.TRANSACTION_SIGNED);
    }
  } catch (e) {
    invariant(false, `Error while sending BTC transaction: ${e}`);
  }
}
