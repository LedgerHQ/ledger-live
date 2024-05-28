import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import {
  pressBoth,
  pressRightUntil,
  verifyAddress,
  verifyAmount,
  waitFor,
} from "tests/utils/speculos";
import { Account } from "../enum/Account";
import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import { DeviceLabels } from "tests/enum/DeviceLabels";
import { Currency } from "tests/enum/Currency";

export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness $0")
  async expectValidReceiveAddress(account: Account) {
    await waitFor(account.currency.receivePattern[0]);
    const addressScreen = await pressRightUntil(account.currency.receivePattern[0]);
    expect(verifyAddress(account.address, addressScreen)).toBe(true);
    await pressRightUntil(account.currency.receivePattern[1]);
    await pressBoth();
  }

  async expectValidTxInfo(tx: Transaction) {
    const amountScreen = await pressRightUntil(DeviceLabels.AMOUT);
    expect(verifyAmount(tx.amount, amountScreen)).toBe(true);
    const addressScreen = await pressRightUntil(DeviceLabels.ADDRESS);
    expect(verifyAddress(tx.recipient, addressScreen)).toBe(true);
    await pressRightUntil(tx.accountToDebit.currency.sendPattern[2]);
    await pressBoth();
    if (tx.accountToDebit.currency.uiName === Currency.tBTC.uiName) {
      await waitFor("Fees");
      await pressRightUntil(DeviceLabels.SIGN);
      await pressBoth();
    }
  }
}
