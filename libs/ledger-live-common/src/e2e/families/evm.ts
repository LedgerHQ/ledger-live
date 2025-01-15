import expect from "expect";
import { NFTTransaction, Transaction } from "../models/Transaction";
import { pressBoth, pressUntilTextFound, containsSubstringInEvent, waitFor } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function sendEVM(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (tx.accountToCredit.ensName) {
    const isENSNameCorrect = containsSubstringInEvent(tx.accountToCredit.ensName, events);
    expect(isENSNameCorrect).toBeTruthy();
  } else {
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }

  await pressBoth();
}

export async function sendEvmNFT(tx: NFTTransaction) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
}
