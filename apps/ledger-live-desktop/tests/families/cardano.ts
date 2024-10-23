import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import {
  pressBoth,
  pressUntilTextFound,
  containsSubstringInEvent,
  waitFor,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";

export async function sendCardano(tx: Transaction) {
  await waitFor(DeviceLabels.NEW_ORDINARY_TRANSACTION);
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
