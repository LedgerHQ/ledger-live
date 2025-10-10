import expect from "expect";
import {
  pressBoth,
  pressUntilTextFound,
  containsSubstringInEvent,
  getDelegateEvents,
} from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { Device } from "../enum/Device";
import { Transaction } from "../models/Transaction";
import { Delegate } from "../models/Delegate";

export async function delegateSolana(delegatingAccount: Delegate) {
  await getDelegateEvents(delegatingAccount);
  await pressBoth();
}

export async function sendSolana(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.APPROVE);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  if (process.env.SPECULOS_DEVICE !== Device.LNS.name) {
    const isAddressCorrect = containsSubstringInEvent(
      tx.accountToCredit.parentAccount?.address ?? tx.accountToCredit.address,
      events,
    );
    expect(isAddressCorrect).toBeTruthy();
  }

  await pressBoth();
}
