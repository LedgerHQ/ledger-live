import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
} from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "../enum/Account";
import { expect } from "@playwright/test";
import { Transaction } from "tests/models/Transaction";
import { Delegate } from "tests/models/Delegate";
import { DeviceLabels } from "tests/enum/DeviceLabels";
import { Currency } from "tests/enum/Currency";
import { Swap } from "tests/models/Swap";
import { extractNumberFromString } from "tests/utils/textParserUtils";
export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: Account) {
    let deviceLabels: string[];

    switch (account.currency) {
      case Currency.SOL:
        deviceLabels = [DeviceLabels.PUBKEY, DeviceLabels.APPROVE, DeviceLabels.REJECT];
        break;
      case Currency.DOT:
      case Currency.ATOM:
        deviceLabels = [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT];
        break;
      default:
        deviceLabels = [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT];
        break;
    }

    await waitFor(deviceLabels[0]);
    const events = await pressUntilTextFound(deviceLabels[1]);
    const isAddressCorrect = containsSubstringInEvent(account.address, events);
    expect(isAddressCorrect).toBeTruthy();
    await pressBoth();
  }

  @step("Activate Ledger Sync")
  async activateLedgerSync() {
    await pressUntilTextFound(DeviceLabels.MAKE_SURE_TO_USE);
    await pressUntilTextFound(DeviceLabels.CONNECT_WITH);
    await pressBoth();
    await pressUntilTextFound(DeviceLabels.YOUR_CRYPTO_ACCOUNTS);
    await pressUntilTextFound(DeviceLabels.TURN_ON_SYNC);
    await pressBoth();
  }

  @step("Send method - EVM")
  async sendEVM(tx: Transaction) {
    const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
    const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();

    await pressBoth();
  }

  @step("Send method - BTC-based coin")
  async sendBTCBasedCoin(tx: Transaction) {
    let deviceLabel: string;

    switch (tx.accountToDebit.currency) {
      case Currency.BTC:
        deviceLabel = DeviceLabels.CONTINUE;
        break;
      case Currency.DOGE:
        deviceLabel = DeviceLabels.ACCEPT;
        break;
      default:
        throw new Error(`Not a BTC-based coin: ${tx.accountToDebit.currency}`);
    }

    const events = await pressUntilTextFound(deviceLabel);
    const isAmountCorrect = containsSubstringInEvent(tx.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    const isAddressCorrect = containsSubstringInEvent(tx.accountToCredit.address, events);
    expect(isAddressCorrect).toBeTruthy();
    await pressBoth();
    await waitFor(DeviceLabels.CONFIRM);
    await pressUntilTextFound(DeviceLabels.ACCEPT);
    await pressBoth();
  }

  @step("Sign Send Transaction")
  async signSendTransaction(tx: Transaction) {
    const currencyName = tx.accountToDebit.currency;
    switch (currencyName) {
      case Currency.sepETH:
        await this.sendEVM(tx);
        break;
      case Currency.BTC:
      case Currency.DOGE:
        await this.sendBTCBasedCoin(tx);
        break;
      default:
        throw new Error(`Unsupported currency: ${currencyName}`);
    }
  }

  @step("Delegate Method - Solana")
  async delegateSolana() {
    await waitFor(DeviceLabels.DELEGATE_FROM);
    await pressUntilTextFound(DeviceLabels.APPROVE);
    await pressBoth();
  }

  @step("Delegate Method - Near")
  async delegateNear(delegatingAccount: Delegate) {
    await waitFor(DeviceLabels.VIEW_HEADER);
    const events = await pressUntilTextFound(DeviceLabels.CONTINUE_TO_ACTION);
    const isProviderCorrect = containsSubstringInEvent(delegatingAccount.provider, events);
    expect(isProviderCorrect).toBeTruthy();
    await pressBoth();
    await waitFor(DeviceLabels.VIEW_ACTION);
    await pressUntilTextFound(DeviceLabels.SIGN);
    await pressBoth();
  }

  @step("Delegate Method - Cosmos")
  async delegateCosmos(delegatingAccount: Delegate) {
    await waitFor(DeviceLabels.PLEASE_REVIEW);
    const events = await pressUntilTextFound(DeviceLabels.CAPS_APPROVE);
    const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
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

  @step("Verify amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: Swap) {
    const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
    await this.verifySwapData(swap, events);
    await pressBoth();
  }

  @step("Verify amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: Swap) {
    const events = await pressUntilTextFound(DeviceLabels.REJECT);
    await this.verifySwapData(swap, events);
    await pressBoth();
  }

  async verifySwapData(swap: Swap, events: string[]) {
    const sendAmountScreen = containsSubstringInEvent(swap.amount, events);
    expect(sendAmountScreen).toBeTruthy();
    this.verifySwapGetAmountScreen(swap, events);
    this.verifySwapFeesAmountScreen(swap, events);
  }

  verifySwapGetAmountScreen(swap: Swap, events: string[]) {
    const parsedAmountToReceive = extractNumberFromString(swap.amountToReceive);
    swap.amountToReceive =
      parsedAmountToReceive.length < 19
        ? parsedAmountToReceive
        : parsedAmountToReceive.substring(0, 18);

    const receivedGetAmount = containsSubstringInEvent(`${swap.amountToReceive}`, events);
    expect(receivedGetAmount).toBeTruthy();
  }

  verifySwapFeesAmountScreen(swap: Swap, events: string[]) {
    const parsedFeesAmount = extractNumberFromString(swap.feesAmount);
    swap.feesAmount =
      parsedFeesAmount.length < 19 ? parsedFeesAmount : parsedFeesAmount.substring(0, 18);

    const receivedFeesAmount = containsSubstringInEvent(swap.feesAmount, events);
    expect(receivedFeesAmount).toBeTruthy();
  }
}
