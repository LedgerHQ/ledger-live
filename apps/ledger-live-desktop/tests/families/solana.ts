import { expect } from "@playwright/test";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";
import { Transaction } from "tests/models/Transaction";

export async function delegateSolana() {
  await waitFor(DeviceLabels.DELEGATE_FROM);
  await pressUntilTextFound(DeviceLabels.APPROVE);
  await pressBoth();
}

export async function sendSolana(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.APPROVE);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  await pressBoth();
}
