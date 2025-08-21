import expect from "expect";
import { pressBoth, pressUntilTextFound, waitFor, containsSubstringInEvent } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { Transaction } from "../models/Transaction";

export async function delegateSolana() {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  await pressBoth();
}

export async function sendSolana(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (process.env.SPECULOS_DEVICE !== Device.LNS) {
    const isAddressCorrect = containsSubstringInEvent(
      tx.accountToCredit.parentAccount?.address ?? tx.accountToCredit.address,
      events,
    );
    expect(isAddressCorrect).toBeTruthy();
  }

  await pressBoth();
}
