import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";

export async function sendBTCBasedCoin(tx: Transaction) {
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
  expect(isAmountCorrect).toBeTruthy();
  const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
  await waitFor(DeviceLabels.CONFIRM);
  await pressUntilTextFound(DeviceLabels.ACCEPT);
  await pressBoth();
}
