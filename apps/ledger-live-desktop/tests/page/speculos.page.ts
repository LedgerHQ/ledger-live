import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import {
  pressBoth,
  pressUntilTextFound,
  waitFor,
  containsSubstringInEvent,
  activateLedgerSync,
} from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { expect } from "@playwright/test";
import { NFTTransaction, Transaction } from "tests/models/Transaction";
import { Delegate } from "tests/models/Delegate";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Swap } from "tests/models/Swap";
import { extractNumberFromString } from "tests/utils/textParserUtils";
import { sendBTCBasedCoin } from "tests/families/bitcoin";
import { sendEVM, sendEvmNFT } from "tests/families/evm";
import { sendPolkadot } from "tests/families/polkadot";
import { sendAlgorand } from "tests/families/algorand";
import { sendTron } from "tests/families/tron";
import { sendStellar } from "tests/families/stellar";
import { sendCardano } from "tests/families/cardano";
import { sendXRP } from "tests/families/xrp";
import { delegateNear } from "tests/families/near";
import { delegateCosmos, sendCosmos } from "tests/families/cosmos";
import { delegateSolana, sendSolana } from "tests/families/solana";
export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: Account, addressDisplayed: string) {
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
    const isAddressCorrect = containsSubstringInEvent(addressDisplayed, events);
    expect(isAddressCorrect).toBeTruthy();
    await pressBoth();
  }

  @step("Activate Ledger Sync")
  async activateLedgerSync() {
    await activateLedgerSync();
  }

  @step("Sign Send NFT Transaction")
  async signSendNFTTransaction(tx: NFTTransaction) {
    const currencyName = tx.accountToDebit.currency;
    switch (currencyName) {
      case Currency.ETH:
        await sendEvmNFT(tx);
        break;
      default:
        throw new Error(`Unsupported currency: ${currencyName}`);
    }
  }

  @step("Sign Send Transaction")
  async signSendTransaction(tx: Transaction) {
    const currencyName = tx.accountToDebit.currency;
    switch (currencyName) {
      case Currency.sepETH:
      case Currency.POL:
        await sendEVM(tx);
        break;
      case Currency.DOGE:
      case Currency.BCH:
        await sendBTCBasedCoin(tx);
        break;
      case Currency.DOT:
        await sendPolkadot(tx);
        break;
      case Currency.ALGO:
        await sendAlgorand(tx);
        break;
      case Currency.SOL:
        await sendSolana(tx);
        break;
      case Currency.TRX:
        await sendTron(tx);
        break;
      case Currency.XLM:
        await sendStellar(tx);
        break;
      case Currency.ATOM:
        await sendCosmos(tx);
        break;
      case Currency.ADA:
        await sendCardano(tx);
        break;
      case Currency.XRP:
        await sendXRP(tx);
        break;
      default:
        throw new Error(`Unsupported currency: ${currencyName}`);
    }
  }

  @step("Sign Delegation Transaction")
  async signDelegationTransaction(delegatingAccount: Delegate) {
    const currencyName = delegatingAccount.account.currency.name;
    switch (currencyName) {
      case Account.SOL_1.currency.name:
        await delegateSolana();
        break;
      case Account.NEAR_1.currency.name:
        await delegateNear(delegatingAccount);
        break;
      case Account.ATOM_1.currency.name:
        await delegateCosmos(delegatingAccount);
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
