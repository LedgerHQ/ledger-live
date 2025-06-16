import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressBoth, pressUntilTextFound, waitFor, containsSubstringInEvent } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

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
