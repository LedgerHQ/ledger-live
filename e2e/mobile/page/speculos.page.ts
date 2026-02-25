import { Step } from "jest-allure2-reporter/api";
import {
  activateContractData,
  goToSettings,
  activateExpertMode,
  expectValidAddressDevice,
  signDelegationTransaction,
  signSendTransaction,
  verifyAmountsAndAcceptSwap,
  verifyAmountsAndAcceptSwapForDifferentSeed,
  verifyAmountsAndRejectSwap,
} from "@ledgerhq/live-common/e2e/speculos";
import { setExchangeDependencies } from "../utils/speculosUtils";
import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";
import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapType, Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

function isSwap(value: SwapType | Account): value is SwapType {
  return value instanceof Swap;
}

export default class SpeculosPage {
  @Step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: AccountType, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }

  @Step("Sign Send Transaction on Speculos")
  async signSendTransaction(tx: TransactionType) {
    await signSendTransaction(tx);
  }

  @Step("Sign Delegation Transaction on Speculos")
  async signDelegationTransaction(delegation: DelegateType) {
    await signDelegationTransaction(delegation);
  }

  @Step("Activate contract data on Speculos")
  async activateContractData() {
    await activateContractData();
  }

  @Step("Go to settings on Speculos")
  async goToSettings() {
    await goToSettings();
  }

  @Step("Activate export mode on Speculos")
  async activateExpertMode() {
    await activateExpertMode();
  }

  @Step("Verify amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    await verifyAmountsAndAcceptSwap(swap, amount);
  }

  @Step("Verify amounts and accept swap for different seed")
  async verifyAmountsAndAcceptSwapForDifferentSeed(
    swap: SwapType,
    amount: string,
    errorMessage: string | null,
  ) {
    await verifyAmountsAndAcceptSwapForDifferentSeed(swap, amount, errorMessage);
  }

  @Step("Verify amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: SwapType, amount: string) {
    await verifyAmountsAndRejectSwap(swap, amount);
  }

  async setExchangeDependencies(swapOrFromAccount: SwapType | Account, toAccount?: Account) {
    let accounts: Account[];
    if (isSwap(swapOrFromAccount)) {
      accounts = [swapOrFromAccount.accountToDebit, swapOrFromAccount.accountToCredit];
    } else {
      accounts = toAccount ? [swapOrFromAccount, toAccount] : [swapOrFromAccount];
    }

    setExchangeDependencies(
      accounts.map(acc => ({
        name: acc.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  }
}
