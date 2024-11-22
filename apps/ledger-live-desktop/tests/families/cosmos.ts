import { expect } from "@playwright/test";
import { Delegate } from "tests/models/Delegate";
import { Transaction } from "tests/models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";

export async function delegateCosmos(delegatingAccount: Delegate) {
  await waitFor(DeviceLabels.PLEASE_REVIEW);
  const events = await pressUntilTextFound(DeviceLabels.CAPS_APPROVE);
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
