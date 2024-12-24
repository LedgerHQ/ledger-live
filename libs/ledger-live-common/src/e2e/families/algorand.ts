import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressBoth, pressUntilTextFound, containsSubstringInEvent } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function sendAlgorand(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.CAPS_APPROVE);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  await pressBoth();
}
