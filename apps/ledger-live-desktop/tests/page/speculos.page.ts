import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import {
  pressBoth,
  pressRightUntil,
  verifyAddress as assertAddressesEquality,
  verifyAmount,
  waitFor,
} from "tests/utils/speculos";
import { Account } from "../enum/Account";
import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import { DeviceLabels } from "tests/enum/DeviceLabels";
import { Currency } from "tests/enum/Currency";

export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness")
  async expectValidReceiveAddress(account: Account) {
    await waitFor(account.currency.receivePattern[0]);
    const actualAddress = await pressRightUntil(account.currency.receivePattern[0]);
    expect(assertAddressesEquality(account.address, actualAddress)).toBe(true);
    await pressRightUntil(account.currency.receivePattern[1]);
    await pressBoth();
  }

  @step("Verify transaction info on device")
  async expectValidTxInfo(tx: Transaction) {
    const amountScreen = await pressRightUntil(tx.accountToDebit.currency.sendPattern[0]);
    expect(verifyAmount(tx.amount, amountScreen)).toBe(true);
    const addressScreen = await pressRightUntil(tx.accountToDebit.currency.sendPattern[1]);
    expect(assertAddressesEquality(tx.accountToCredit.address, addressScreen)).toBe(true);
    await pressRightUntil(tx.accountToDebit.currency.sendPattern[2]);
    await pressBoth();
    if (tx.accountToDebit.currency.name === Currency.DOGE.name) {
      await waitFor("Confirm");
      await pressRightUntil(DeviceLabels.ACCEPT);
      await pressBoth();
    }
  }
}
