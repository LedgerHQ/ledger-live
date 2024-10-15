import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import {
  pressBoth,
  pressRightUntil,
  verifyAddress as assertAddressesEquality,
  verifyAmount,
  verifySwapFeesAmount,
  verifyProvider,
  waitFor,
} from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "../enum/Account";
import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import { Delegate } from "tests/models/Delegate";
import { DeviceLabels } from "tests/enum/DeviceLabels";
import { Currency } from "tests/enum/Currency";
import { Swap } from "tests/models/Swap";
import { AppInfos } from "tests/enum/AppInfos";
import { extractNumberFromString } from "tests/utils/textParserUtils";

export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness")
  async expectValidReceiveAddress(account: Account) {
    const { receivePattern } = account.currency.speculosApp || {};
    if (!receivePattern) {
      return;
    }
    await waitFor(receivePattern[0]);
    const actualAddress = await pressRightUntil(receivePattern[0]);
    expect(assertAddressesEquality(account.address, actualAddress)).toBe(true);
    await pressRightUntil(receivePattern[1]);
    await pressBoth();
  }

  @step("Verify transaction info on device")
  async expectValidTxInfo(tx: Transaction) {
    const { sendPattern } = tx.accountToDebit.currency.speculosApp || {};
    if (!sendPattern) {
      return;
    }
    const amountScreen = await pressRightUntil(sendPattern[0]);
    expect(verifyAmount(tx.amount, amountScreen)).toBe(true);
    const addressScreen = await pressRightUntil(sendPattern[1]);
    expect(assertAddressesEquality(tx.accountToCredit.address, addressScreen)).toBe(true);
    await pressRightUntil(sendPattern[2]);
    await pressBoth();
    if (tx.accountToDebit.currency.name === Currency.DOGE.name) {
      await waitFor("Confirm");
      await pressRightUntil(DeviceLabels.ACCEPT);
      await pressBoth();
    }
  }

  @step("Press right on the device until specified text appears, then confirm the operation")
  async confirmOperationOnDevice(text: string) {
    await pressRightUntil(text);
    await pressBoth();
  }

  @step("Press right on the device until specified text appears")
  async clickNextUntilText(text: string) {
    await pressRightUntil(text);
  }

  @step("Verify swap amounts")
  async verifyAmountsAndRejectSwap(swap: Swap) {
    const { sendPattern } = AppInfos.EXCHANGE;
    if (!sendPattern) {
      return;
    }
    const sendAmountScreen = await pressRightUntil(sendPattern[0]);
    expect(
      verifyAmount(`${swap.accountToDebit.currency.ticker} ${swap.amount}`, sendAmountScreen),
    ).toBeTruthy();
    const getAmountScreen = await pressRightUntil(sendPattern[1]);
    this.verifySwapGetAmountScreen(swap, getAmountScreen);
    this.verifySwapFeesAmountScreen(swap, await pressRightUntil(sendPattern[2]));
    await pressRightUntil(DeviceLabels.REJECT);
    await pressBoth();
  }

  verifySwapGetAmountScreen(swap: Swap, getAmountScreen: string[]) {
    swap.amountToReceive =
      extractNumberFromString(swap.amountToReceive).length < 19
        ? extractNumberFromString(swap.amountToReceive)
        : extractNumberFromString(swap.amountToReceive).substring(0, 18);
    expect(verifyAmount(`${swap.amountToReceive}`, getAmountScreen)).toBeTruthy();
  }

  verifySwapFeesAmountScreen(swap: Swap, feesAmountScreen: string[]) {
    const feesAmount =
      extractNumberFromString(swap.feesAmount).length < 19
        ? extractNumberFromString(swap.feesAmount)
        : extractNumberFromString(swap.feesAmount).substring(0, 18);
    expect(
      verifySwapFeesAmount(swap.accountToDebit.currency.name, feesAmount, feesAmountScreen),
    ).toBeTruthy();
  }

  @step("Delegate Method - Solana")
  async delegateSolana(delegatingAccount: Delegate) {
    const { delegatePattern } = delegatingAccount.account.currency.speculosApp || {};
    if (!delegatePattern) {
      return;
    }
    await waitFor(delegatePattern[0]);
    await pressRightUntil(delegatePattern[2]);
    await pressBoth();
  }

  @step("Delegate Method - Near")
  async delegateNear(delegatingAccount: Delegate) {
    const { delegatePattern } = delegatingAccount.account.currency.speculosApp || {};
    if (!delegatePattern) {
      return;
    }
    await waitFor(delegatePattern[0]);
    const provider = await pressRightUntil(delegatePattern[1]);
    expect(verifyProvider(delegatingAccount.provider, provider)).toBe(true);
    await pressRightUntil(delegatePattern[2]);
    await pressBoth();
    await waitFor(delegatePattern[3]);
    await pressRightUntil(delegatePattern[7]);
    await pressBoth();
  }

  @step("Delegate Method - Cosmos")
  async delegateCosmos(delegatingAccount: Delegate) {
    const { delegatePattern } = delegatingAccount.account.currency.speculosApp || {};
    if (!delegatePattern) {
      return;
    }
    await waitFor(delegatePattern[0]);
    const amount = await pressRightUntil(delegatePattern[1]);
    expect(verifyAmount(delegatingAccount.amount, amount)).toBe(true);
    await pressRightUntil(delegatePattern[2]);
    await pressBoth();
  }

  @step("Sign Delegation Transaction")
  async signDelegationTransaction(delegatingAccount: Delegate) {
    const currencyName = delegatingAccount.account.currency.name;
    switch (currencyName) {
      case Account.SOL_1.currency.name:
        await this.delegateSolana(delegatingAccount);
        break;
      case Account.NEAR_1.currency.name:
        await this.delegateNear(delegatingAccount);
        break;
      case Account.ATOM_1.currency.name:
        await this.delegateCosmos(delegatingAccount);
        break;
      default:
        throw new Error(`Unsupported currency: ${currencyName}`);
    }
  }
}
