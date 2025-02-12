import expect from "expect";
import { Transaction } from "../models/Transaction";
import { pressBoth, pressUntilTextFound, containsSubstringInEvent, waitFor } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function sendCardano(tx: Transaction) {
  await waitFor(DeviceLabels.NEW_ORDINARY);
  await pressBoth();
  await pressUntilTextFound(DeviceLabels.SEND_TO_ADDRESS_2);
  await pressBoth();
  const events = await pressUntilTextFound(DeviceLabels.SEND);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
  await waitFor(DeviceLabels.TRANSACTION_FEE);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM_TRANSACTION);
  await pressBoth();

  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
}

export async function delegateCardano() {
  await waitFor(DeviceLabels.NEW_ORDINARY);
  await pressBoth();
  await waitFor(DeviceLabels.TRANSACTION_FEE);
  await pressBoth();
  await waitFor(DeviceLabels.REGISTER);
  await pressBoth();
  await waitFor(DeviceLabels.STAKE_KEY);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressBoth();
  await waitFor(DeviceLabels.DELEGATE_STAKE);
  await pressBoth();
  await waitFor(DeviceLabels.STAKE_KEY);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressBoth();
}
