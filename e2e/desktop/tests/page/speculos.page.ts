import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import * as allure from "allure-js-commons";
import {
  activateLedgerSync,
  expectValidAddressDevice,
  signSendTransaction,
  signDelegationTransaction,
  verifyAmountsAndAcceptSwap,
  verifyAmountsAndAcceptSwapForDifferentSeed,
  verifyAmountsAndRejectSwap,
  activateExpertMode,
  activateContractData,
  removeMemberLedgerSync,
  providePublicKey,
  exportUfvk,
  shareViewKey,
  approveToken,
  signTypedMessage as signTypedMessageDevice,
  acceptEnableTransactionCheck as acceptEnableTransactionCheckDevice,
} from "@ledgerhq/live-e2e-shared/speculos";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";

import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";

function formatSwapScenario(swap: Swap, amount: string): string {
  const from = swap.accountToDebit.currency.name;
  const to = swap.accountToCredit.currency.name;
  const provider = swap.provider?.uiName ?? "unknown";
  return `${from} → ${to} | amount ${amount} | provider ${provider}`;
}

export class SpeculosPage extends AppPage {
  @step("Verify receive address correctness on device")
  async expectValidAddressDevice(account: Account, addressDisplayed: string) {
    await expectValidAddressDevice(account, addressDisplayed);
  }

  @step("Remove member from Ledger Sync")
  async removeMemberFromLedgerSync() {
    await removeMemberLedgerSync();
  }

  @step("Activate Ledger Sync")
  async activateLedgerSync() {
    await activateLedgerSync();
  }

  @step("Sign Send Transaction")
  async signSendTransaction(tx: Transaction) {
    await signSendTransaction(tx);
  }

  @step("Sign Delegation Transaction")
  async signDelegationTransaction(delegatingAccount: Delegate) {
    await signDelegationTransaction(delegatingAccount);
  }

  @step("Verify amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: Swap, amount: string) {
    const scenario = formatSwapScenario(swap, amount);
    await allure.parameter("Swap scenario", scenario);
    try {
      await verifyAmountsAndAcceptSwap(swap, amount);
    } catch (error) {
      if (error instanceof Error) error.message += `\n↳ Swap scenario: ${scenario}`;
      throw error;
    }
  }

  @step("Verify amounts and accept swap for different seed")
  async verifyAmountsAndAcceptSwapForDifferentSeed(
    swap: Swap,
    amount: string,
    errorMessage: string | null,
  ) {
    await verifyAmountsAndAcceptSwapForDifferentSeed(swap, amount, errorMessage);
  }

  @step("Verify amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: Swap, amount: string) {
    await verifyAmountsAndRejectSwap(swap, amount);
  }

  @step("Activate expert mode")
  async activateExpertMode() {
    await activateExpertMode();
  }

  @step("Activate contract data")
  async activateContractData() {
    await activateContractData();
  }

  @step("Provide Public Key")
  async providePublicKey() {
    await providePublicKey();
  }

  @step("Export UFVK")
  async exportUfvk(account: Account) {
    await exportUfvk(account);
  }

  @step("Share view key")
  async shareViewKey() {
    await shareViewKey();
  }

  @step("Sign token approval on device")
  async signTokenApproval() {
    await approveToken();
  }

  @step("Sign EVM contract transaction")
  async signEvmContractTransaction() {
    await approveToken();
  }

  @step("Sign typed message on device")
  async signTypedMessage() {
    await signTypedMessageDevice();
  }

  @step("Check and accept if available enable transaction check")
  async acceptEnableTransactionCheck() {
    await acceptEnableTransactionCheckDevice();
  }
}
