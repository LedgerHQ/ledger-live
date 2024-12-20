import expect from "expect";
import { NFTTransaction, Transaction } from "../models/Transaction";
import { pressBoth, pressUntilTextFound, containsSubstringInEvent, waitFor } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function sendEVM(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  await pressBoth();
}

export async function sendEvmNFT(tx: NFTTransaction) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
}
