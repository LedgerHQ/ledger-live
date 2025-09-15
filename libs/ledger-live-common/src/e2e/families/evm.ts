import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressBoth, pressUntilTextFound, containsSubstringInEvent } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";

export async function sendEVM(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device.LNS) {
    const isENSNameCorrect = containsSubstringInEvent(tx.accountToCredit.ensName, events);
    expect(isENSNameCorrect).toBeTruthy();
  } else {
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
  }

  await pressBoth();
}
