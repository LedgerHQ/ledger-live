import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import {
  pressBoth,
  pressRightUntil,
  pressRightUntil2,
  verifyAddress as assertAddressesEquality,
  verifyAmount,
  verifyAmount2,
  verifySwapFeesAmount,
  waitFor,
  verifyString,
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

  /*@step("Verify transaction info on device")
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
    await pressBoth(); //Marche pour ETH et POL
    if (
      tx.accountToDebit.currency.name === Currency.DOGE.name ||
      tx.accountToDebit.currency.name === Currency.BCH.name
    ) {
      await waitFor("Confirm");
      await pressRightUntil(DeviceLabels.ACCEPT);
      await pressBoth();
    }
  }*/

  @step("Sign tx on device")
  async signTransaction(tx: Transaction) {
    const { sendPattern } = tx.accountToDebit.currency.speculosApp || {};
    if (!sendPattern) {
      return;
    }
    const events = await pressRightUntil2(DeviceLabels.ACCEPT); //Update par la suite en fonction du bonne approve

    console.log("------------Amount----------------");
    console.log("tx.amount: ", tx.amount);
    const isAmountCorrect = verifyAmount2(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();

    console.log("------------Address----------------");
    console.log("tx.accountToCredit.address: ", tx.accountToCredit.address);
    const isAddressCorrect = verifyString(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();

    await pressBoth();
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

  @step("Delegate Method - Solana")
  async delegateSolana() {
    await waitFor(DeviceLabels.DELEGATE_FROM);
    await pressRightUntil2(DeviceLabels.APPROVE);
    await pressBoth();
  }

  @step("Delegate Method - Near")
  async delegateNear(delegatingAccount: Delegate) {
    await waitFor(DeviceLabels.VIEW_HEADER);
    const events = await pressRightUntil2(DeviceLabels.CONTINUE_TO_ACTION);
    const isProviderCorrect = verifyString(delegatingAccount.provider, events);
    expect(isProviderCorrect).toBeTruthy();
    await pressBoth();
    await waitFor(DeviceLabels.VIEW_ACTION);
    await pressRightUntil2(DeviceLabels.SIGN);
    await pressBoth();
  }

  @step("Delegate Method - Cosmos")
  async delegateCosmos(delegatingAccount: Delegate) {
    await waitFor(DeviceLabels.PLEASE_REVIEW);
    const events = await pressRightUntil2(DeviceLabels.CAPS_APPROVE);
    const isAmountCorrect = verifyAmount2(delegatingAccount.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    await pressBoth();
  }

  @step("Sign Delegation Transaction")
  async signDelegationTransaction(delegatingAccount: Delegate) {
    const currencyName = delegatingAccount.account.currency.name;
    switch (currencyName) {
      case Account.SOL_1.currency.name:
        await this.delegateSolana();
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

  verifySwapGetAmountScreen(swap: Swap, getAmountScreen: string[]) {
    if (swap.accountToCredit.currency.name === "Solana") {
      expect(
        verifyAmount(
          `${extractNumberFromString(swap.amountToReceive)} ${swap.accountToCredit.currency.ticker}`,
          getAmountScreen,
        ),
      ).toBeTruthy();
    } else {
      expect(
        verifyAmount(
          `${swap.accountToCredit.currency.ticker} ${extractNumberFromString(swap.amountToReceive)}`,
          getAmountScreen,
        ),
      ).toBeTruthy();
    }
  }

  verifySwapFeesAmountScreen(swap: Swap, feesAmountScreen: string[]) {
    let speculosFeesAmount = "";
    if (swap.feesAmount) {
      //max number of chars on the screen
      speculosFeesAmount =
        extractNumberFromString(swap.feesAmount).length < 18
          ? extractNumberFromString(swap.feesAmount)
          : extractNumberFromString(swap.feesAmount).substring(0, 17);
    }
    expect(
      verifySwapFeesAmount(swap.accountToDebit.currency.name, speculosFeesAmount, feesAmountScreen),
    ).toBeTruthy();
  }
}
