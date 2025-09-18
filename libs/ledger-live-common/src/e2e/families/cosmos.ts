import expect from "expect";
import { Delegate } from "../models/Delegate";
import { Transaction } from "../models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  containsSubstringInEvent,
  getDelegateEvents,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";

export async function delegateCosmos(delegatingAccount: Delegate) {
  const events = await getDelegateEvents(delegatingAccount);
  const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  await pressBoth();
}

export async function sendCosmos(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.CAPS_APPROVE);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  await pressBoth();
}
