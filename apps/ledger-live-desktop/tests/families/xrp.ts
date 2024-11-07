import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  containsSubstringInEvent,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "tests/enum/DeviceLabels";

export async function sendXRP(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.SIGN);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();

  await pressBoth();
}
