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
import { TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account, AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapType, Swap } from "@ledgerhq/live-common/e2e/models/Swap";

import { SpeculosUtils } from "../utils/SpeculosUtils.ts";

function isSwap(value: SwapType | Account): value is SwapType {
  return value instanceof Swap;
}

export class SpeculosPage {
  async expectValidAddressDevice(account: AccountType, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }

  async signSendTransaction(tx: TransactionType) {
    await signSendTransaction(tx);
  }

  async signDelegationTransaction(delegation: DelegateType) {
    await signDelegationTransaction(delegation);
  }

  async activateContractData() {
    await activateContractData();
  }

  async goToSettings() {
    await goToSettings();
  }

  async activateExpertMode() {
    await activateExpertMode();
  }

  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    await verifyAmountsAndAcceptSwap(swap, amount);
  }

  async verifyAmountsAndAcceptSwapForDifferentSeed(
    swap: SwapType,
    amount: string,
    errorMessage: string | null,
  ) {
    await verifyAmountsAndAcceptSwapForDifferentSeed(swap, amount, errorMessage);
  }

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

    SpeculosUtils.setExchangeDependencies(
      accounts.map(acc => ({
        name: acc.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  }
}
