import { expect, type Page } from "@playwright/test";
import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import type { PageLogCollector } from "tests/utils/pageLogCollector";
import {
  activateLedgerSync,
  expectValidAddressDevice,
  signSendTransaction,
  signDelegationTransaction,
  verifyAmountsAndAcceptSwap,
  verifyAmountsAndAcceptSwapForDifferentSeed,
  verifyAmountsAndRejectSwap,
  activateExpertMode,
  removeMemberLedgerSync,
  exportUfvk,
  shareViewKey,
  approveToken,
  signTypedMessage as signTypedMessageDevice,
  acceptEnableTransactionCheck as acceptEnableTransactionCheckDevice,
  confirmContactAction,
  waitForAppReady,
  enableBlindSigningOnNanoS,
  resetSpeculosEvents,
} from "@ledgerhq/live-e2e-shared/speculos";
import { signTronRentPayment } from "@ledgerhq/live-e2e-shared/families/tronSponsored";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";

import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

function formatSwapScenario(swap: Swap, amount: string): string {
  const from = swap.accountToDebit.currency.name;
  const to = swap.accountToCredit.currency.name;
  const provider = swap.provider?.uiName ?? "unknown";
  return `${from} → ${to} | amount ${amount} | provider ${provider}`;
}

export class SpeculosPage extends AppPage {
  constructor(
    page: Page,
    private readonly webviewCollector?: PageLogCollector,
  ) {
    super(page);
  }

  /**
   * Once the swap live app logs a failed swap initialization, Ledger Wallet never sends the
   * transaction, so the device stays on the Exchange app's idle screen: stop waiting for the review.
   */
  private readonly swapInitFailed = (): string | null =>
    this.webviewCollector?.getSwapInitFailure() ?? null;

  private readonly swapErrorDrawer = this.page.getByTestId("drawer-content");

  /**
   * Runs a swap device step. When it fails because swap initialization failed, the app's error
   * drawer may still be sliding in: let it finish, so the failure screenshot shows the error.
   */
  private async showingSwapInitError(deviceStep: () => void | Promise<void>): Promise<void> {
    try {
      await deviceStep();
    } catch (error) {
      if (this.swapInitFailed()) {
        try {
          await expect(this.swapErrorDrawer).toBeInViewport({ ratio: 1, timeout: TIMEOUT.small });
        } catch {
          // Best effort: without the drawer the screenshot is less useful, not wrong.
        }
      }
      throw error;
    }
  }

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

  @step("Sign the Tronify rent payment of $0 USDT to $1")
  async signTronRentPayment(amount: string, payee: string) {
    await signTronRentPayment(amount, payee);
  }

  @step("Clear the device screen events")
  async resetSpeculosEvents() {
    await resetSpeculosEvents();
  }

  @step("Sign Delegation Transaction")
  async signDelegationTransaction(delegatingAccount: Delegate) {
    await signDelegationTransaction(delegatingAccount);
  }

  @step("Verify amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: Swap, amount: string) {
    const scenario = formatSwapScenario(swap, amount);
    try {
      await this.showingSwapInitError(() =>
        verifyAmountsAndAcceptSwap(swap, amount, { giveUpWhen: this.swapInitFailed }),
      );
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
    await this.showingSwapInitError(() =>
      verifyAmountsAndAcceptSwapForDifferentSeed(swap, amount, errorMessage, {
        giveUpWhen: this.swapInitFailed,
      }),
    );
  }

  @step("Verify amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: Swap, amount: string) {
    await this.showingSwapInitError(() =>
      verifyAmountsAndRejectSwap(swap, amount, { giveUpWhen: this.swapInitFailed }),
    );
  }

  @step("Activate expert mode")
  async activateExpertMode() {
    await activateExpertMode();
  }

  @step("Export UFVK")
  async exportUfvk(account: Account) {
    await exportUfvk(account);
  }

  @step("Wait for the device to return to its app-ready screen")
  async waitForAppReady(speculosApp: AppInfos) {
    await waitForAppReady(speculosApp);
  }

  @step("Share view key")
  async shareViewKey() {
    await shareViewKey();
  }

  @step("Enable blind signing if the device is a Nano S")
  async enableBlindSigningOnNanoS() {
    await enableBlindSigningOnNanoS();
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

  @step("Confirm the contact action on device")
  async confirmContactAction() {
    await confirmContactAction();
  }
}
