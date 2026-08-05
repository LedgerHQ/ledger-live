import { Step } from "jest-allure2-reporter/api";
import { delay, isAndroid } from "../../helpers/commonHelpers";
import { WebElementHelpers } from "../../helpers/elementHelpers";
import { refreshSpeculosForSigning } from "../../utils/speculosUtils";
import { retryUntilTimeout } from "../../utils/retry";

const MAINNET_FUNDING_HINT =
  "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

export default class BorrowPage {
  private readonly webTestIdProbe = { timeout: 2_000, throwOnTimeout: false as const };
  private readonly borrowScreenId = "borrow-screen";
  private readonly executionStepTimeoutMs = 240_000;
  private readonly simulateLoanExecutionUrlTimeoutMs = 60_000;
  private readonly simulateContinueReadyTimeoutMs = 30_000;

  // Mirror borrow-live-app/packages/features/src/testIds.ts
  private readonly introModalId = "borrow-intro-modal";
  private readonly introModalTitleId = "borrow-intro-modal-title";
  private readonly introModalCloseButtonId = "borrow-intro-modal-close";
  private readonly simulateMyLoanButtonId = "borrow-simulate-my-loan-button";
  private readonly simulateLoanScreenId = "borrow-simulate-loan-screen";
  private readonly loanAmountInputId = "borrow-loan-amount-input";
  private readonly simulateContinueButtonId = "borrow-simulate-continue-button";
  private readonly getNewLoanButtonId = "borrow-get-new-loan-button";
  private readonly loanExecutionScreenId = "borrow-loan-execution-screen";
  private readonly giveApprovalButtonId = "give-approval-button";
  private readonly authorizeDepositingButtonId = "borrow-authorize-depositing-button";
  private readonly authorizeBorrowingButtonId = "borrow-authorize-borrowing-button";
  private readonly step1AccessApprovedId = "borrow-step-1-access-approved";
  private readonly step2DepositDoneId = "borrow-step-2-deposit-done";
  private readonly step3BorrowDoneId = "borrow-step-3-borrow-done";
  private readonly executionErrorId = "borrow-execution-error";
  private readonly onChainFailedMessageId = "borrow-on-chain-failed-message";
  private readonly loanCompletionCardId = "borrow-loan-completion-card";
  private readonly viewMyLoanButtonId = "borrow-view-my-loan-button";
  private readonly yourLoansTitleId = "borrow-your-loans-title";
  private readonly loansDashboardId = "borrow-loans-dashboard";
  private readonly repayButtonId = "borrow-repay-button";
  private readonly loanDashboardRowId = "borrow-loan-dashboard-row";
  private readonly repayModalId = "borrow-repay-modal";
  private readonly repayInFullButtonId = "borrow-repay-in-full-button";
  private readonly repayContinueButtonId = "borrow-repay-continue-button";
  private readonly repayExecutionScreenId = "borrow-repay-execution-screen";
  private readonly authorizeRepayButtonId = "borrow-authorize-repay-button";
  private readonly repayStep1AccessApprovedId = "borrow-repay-step-1-access-approved";
  private readonly repayStep2RepayDoneId = "borrow-repay-step-2-repay-done";
  private readonly repayCompletionCardId = "borrow-repay-completion-card";
  private readonly withdrawCollateralButtonId = "borrow-withdraw-collateral-button";
  private readonly withdrawExecutionScreenId = "borrow-withdraw-execution-screen";
  private readonly authorizeWithdrawButtonId = "borrow-authorize-withdraw-button";
  private readonly withdrawStepDoneId = "borrow-withdraw-step-done";
  private readonly withdrawCompletionCardId = "borrow-withdraw-completion-card";
  private readonly backToMyLoansButtonId = "borrow-back-to-my-loans-button";
  /** Native Borrow error sheet (custom.bottomSheet.error) — not in the webview. */
  private readonly borrowErrorBottomSheetCtaId = "borrow-error-bottom-sheet-cta";

  /** XPath fallbacks when testids are missing or not yet mounted (borrow-live-app gaps). */
  private readonly introModalCloseFallbackXpath =
    "//*[@data-testid='borrow-intro-modal']//button[contains(@aria-label, 'Close') or contains(@aria-label, 'close')]";
  private readonly tryAgainButtonXpath = "//button[contains(., 'Try again')]";
  private readonly authorizeRepayFallbackXpath =
    "//*[(self::button or @role='button') and contains(normalize-space(.), 'Authorize repayment')]";
  private readonly authorizeWithdrawFallbackXpath =
    "//*[(self::button or @role='button') and contains(normalize-space(.), 'Authorize withdrawal')]";

  @Step("Expect borrow native screen visible")
  async expectBorrowScreenVisible() {
    await waitForElementById(this.borrowScreenId);
    await waitForElementById(app.common.walletApiWebview, undefined, { checkVisibility: false });
    await waitForWebviewContentToRender();
  }

  @Step("Expect simulate-loan screen ready")
  async expectSimulateLoanScreen() {
    await this.ensureSimulateLoanScreen();
  }

  @Step("Expect loans dashboard on hot start")
  async expectLoansDashboardVisible() {
    await this.expectHotStartLoansDashboard();
  }

  @Step("Verify Introducing Crypto Loan modal is visible")
  async verifyIntroModalVisible() {
    await waitWebElementByTestId(this.introModalId);
    await detoxExpect(getWebElementByTestId(this.introModalId)).toExist();
    await detoxExpect(getWebElementByTestId(this.introModalTitleId)).toExist();
  }

  private async ensureSimulateLoanScreen() {
    try {
      await waitForCurrentWebviewUrlToContain("/loan/simulate-loan", 5_000);
      await waitWebElementByTestId(this.simulateLoanScreenId);
      await this.dismissIntroModalOnSimulateLoanIfVisible();
      return;
    } catch {
      // Not on simulate-loan yet — assert a known entry screen, then act once.
    }

    const introVisible = !!(await waitWebElementByTestId(this.introModalId, {
      timeout: 60_000,
      throwOnTimeout: false,
    }));
    const getNewLoanVisible = introVisible
      ? false
      : !!(await waitWebElementByTestId(this.getNewLoanButtonId, {
          timeout: 60_000,
          throwOnTimeout: false,
        }));

    if (!introVisible && !getNewLoanVisible) {
      const url = await getCurrentWebviewUrl();
      throw new Error(
        `Borrow open-loan entry: expected intro modal or get-new-loan CTA (url: ${url})`,
      );
    }

    if (introVisible) {
      await this.clickSimulateMyLoan();
      return;
    }

    await waitForWebElementToBeEnabled(this.getNewLoanButtonId);
    await tapWebElementByTestId(this.getNewLoanButtonId);
    await waitForCurrentWebviewUrlToContain("/loan/simulate-loan");
    await waitWebElementByTestId(this.simulateLoanScreenId);
    await this.dismissIntroModalOnSimulateLoanIfVisible();
  }

  @Step("Click Simulate my loan on intro modal")
  async clickSimulateMyLoan() {
    await waitForWebElementToBeEnabled(this.simulateMyLoanButtonId);
    await tapWebElementByTestId(this.simulateMyLoanButtonId);
    await waitForCurrentWebviewUrlToContain("/loan/simulate-loan");
    await waitWebElementByTestId(this.simulateLoanScreenId);
    await this.dismissIntroModalOnSimulateLoanIfVisible();
  }

  /** Cold-start tour can overlay simulate-loan even when the route is already loaded. */
  private async dismissIntroModalOnSimulateLoanIfVisible() {
    if (!(await waitWebElementByTestId(this.introModalId, this.webTestIdProbe))) {
      return;
    }
    await waitForWebElementToBeEnabled(this.simulateMyLoanButtonId);
    await tapWebElementByTestId(this.simulateMyLoanButtonId);
    await this.waitUntil(
      async () => !(await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)),
      10_000,
    );
  }

  @Step("Type loan amount")
  async typeLoanAmount(amount: string) {
    await waitWebElementByTestId(this.simulateLoanScreenId);
    await this.dismissIntroModalOnSimulateLoanIfVisible();
    await waitWebElementByTestId(this.loanAmountInputId);

    if (isAndroid()) {
      const firstDigit = amount[0];
      if (!firstDigit) {
        throw new Error("Borrow simulate-loan: loan amount must not be empty");
      }
      // Native simulate-loan drives amount via CustomKeyboard + Redux (input is read-only).
      await waitWebElementByTestId(this.simulateLoanKeypadDigitTestId(firstDigit), {
        timeout: 30_000,
      });
      for (const digit of amount) {
        await this.tapSimulateLoanKeypadDigit(digit);
      }
    } else {
      await tapWebElementByTestId(this.loanAmountInputId);
      await typeTextByWebTestId(this.loanAmountInputId, amount);
    }

    await waitForWebElementToBeEnabled(
      this.simulateContinueButtonId,
      this.simulateContinueReadyTimeoutMs,
    );
  }

  /** Matches borrow-live-app CustomKeyboard test ids (custom-keyboard-key-1, etc.). */
  private simulateLoanKeypadDigitTestId(digit: string): string {
    return `custom-keyboard-key-${digit}`;
  }

  private async tapSimulateLoanKeypadDigit(digit: string) {
    const testId = this.simulateLoanKeypadDigitTestId(digit);
    const element = WebElementHelpers.getWebElementByTestId(testId);
    await WebElementHelpers.scrollToWebElement(element);
    await retryUntilTimeout(async () => {
      await element.runScript(
        (el: HTMLButtonElement, keyId: string) => {
          if (!el.isConnected) {
            throw new Error(`keypad key "${keyId}" not connected`);
          }
          if (el.disabled) {
            throw new Error(`keypad key "${keyId}" is disabled`);
          }
          el.click();
        },
        [testId],
      );
    }, 5_000);
    await delay(200);
  }

  @Step("Click Continue on simulate loan")
  async clickContinue() {
    await waitForWebElementToBeEnabled(
      this.simulateContinueButtonId,
      this.simulateContinueReadyTimeoutMs,
    );
    const continueButton = WebElementHelpers.getWebElementByTestId(this.simulateContinueButtonId);
    await WebElementHelpers.scrollToWebElement(continueButton);
    await retryUntilTimeout(async () => {
      await continueButton.runScript((el: HTMLButtonElement) => {
        if (!el.isConnected) {
          throw new Error("simulate continue button not connected");
        }
        if (el.disabled || el.getAttribute("aria-disabled") === "true") {
          throw new Error("simulate continue button disabled");
        }
        el.click();
      });
    }, 5_000);
  }

  @Step("Verify loan execution flow is visible")
  async expectExecutionFlowVisible() {
    await waitForCurrentWebviewUrlToContain(
      "/loan/loan-execution",
      this.simulateLoanExecutionUrlTimeoutMs,
    );
    await waitWebElementByTestId(this.loanExecutionScreenId);
  }

  @Step("Complete Give approval step if required")
  async completeGiveApprovalIfRequired(): Promise<boolean> {
    await waitWebElementByTestId(this.loanExecutionScreenId);
    return this.clickGiveApprovalWhenReady(
      this.step1AccessApprovedId,
      this.giveApprovalButtonId,
      this.authorizeDepositingButtonId,
      "Open loan Step 1 approval",
    );
  }

  @Step("Complete repay Give approval step if required")
  async completeRepayGiveApprovalIfRequired(): Promise<boolean> {
    await waitWebElementByTestId(this.repayExecutionScreenId);
    return this.clickGiveApprovalWhenReady(
      this.repayStep1AccessApprovedId,
      this.giveApprovalButtonId,
      this.authorizeRepayButtonId,
      "Repay Step 1 approval",
    );
  }

  /**
   * Same as token.approval.swap / desktop borrow: advance fee/summary if shown, then sign on
   * Speculos directly. Do not wait for the DIE Connect device screen — Speculos polls the device.
   */
  @Step("Continue host sign transaction")
  async continueHostSignTransaction() {
    try {
      await waitForElementById(app.send.summaryContinueEnabledButtonId, 5_000);
      await app.send.summaryContinue();
      return;
    } catch {
      // Mobile borrow uses DIE connect-device when no native Send summary is shown.
    }

    try {
      await app.common.selectKnownDevice();
    } catch {
      // Last connected Speculos may already be selected / auto-connect in progress.
    }
  }

  @Step("Complete host device signature")
  async completeHostDeviceSignature(speculosAppName: string, signOnDevice: () => Promise<void>) {
    await refreshSpeculosForSigning(speculosAppName);
    await this.continueHostSignTransaction();
    await signOnDevice();
  }

  @Step("Wait for Step 1 approval to complete")
  async expectApprovalStepCompleted() {
    await this.expectExecutionStepOutcome(this.step1AccessApprovedId, "Borrow Step 1 approval");
    await waitForWebElementToBeEnabled(this.authorizeDepositingButtonId);
  }

  @Step("Wait for repay Step 1 approval to complete")
  async expectRepayApprovalStepCompleted() {
    await this.expectExecutionStepOutcome(this.repayStep1AccessApprovedId, "Repay Step 1 approval");
    await waitForWebElementToBeEnabled(this.authorizeRepayButtonId);
  }

  @Step("Click Authorize depositing")
  async clickAuthorizeDepositing() {
    await waitForWebElementToBeEnabled(this.authorizeDepositingButtonId);
    await tapWebElementByTestId(this.authorizeDepositingButtonId);
  }

  @Step("Wait for Step 2 deposit to complete")
  async expectDepositStepCompleted() {
    await this.expectExecutionStepOutcome(this.step2DepositDoneId, "Borrow Step 2 deposit");
  }

  @Step("Click Authorize borrowing")
  async clickAuthorizeBorrowing() {
    await waitForWebElementToBeEnabled(this.authorizeBorrowingButtonId);
    await tapWebElementByTestId(this.authorizeBorrowingButtonId);
  }

  @Step("Wait for Step 3 borrow to complete")
  async expectBorrowStepCompleted() {
    await this.expectFlowComplete(
      [this.step3BorrowDoneId, this.loanCompletionCardId, this.viewMyLoanButtonId],
      "Borrow Step 3",
    );
  }

  @Step("Verify loan success screen")
  async expectLoanSuccess() {
    await waitWebElementByTestId(this.loanCompletionCardId, { timeout: 60_000 });
    await detoxExpect(getWebElementByTestId(this.viewMyLoanButtonId)).toExist();
  }

  /** Desktop parity: authorize → sign → optional Try again → re-authorize → re-sign → assert. */
  @Step("Authorize depositing with on-chain retry")
  async authorizeDepositingWithRetry(speculosAppName: string, signOnDevice: () => Promise<void>) {
    await this.authorizeExecutionWithRetry(
      () => this.clickAuthorizeDepositing(),
      speculosAppName,
      signOnDevice,
      () => this.expectDepositStepCompleted(),
    );
  }

  @Step("Authorize borrowing with on-chain retry")
  async authorizeBorrowingWithRetry(speculosAppName: string, signOnDevice: () => Promise<void>) {
    await this.authorizeExecutionWithRetry(
      () => this.clickAuthorizeBorrowing(),
      speculosAppName,
      signOnDevice,
      () => this.expectBorrowStepCompleted(),
    );
  }

  @Step("Authorize repayment with on-chain retry")
  async authorizeRepayWithRetry(speculosAppName: string, signOnDevice: () => Promise<void>) {
    await this.authorizeExecutionWithRetry(
      () => this.clickAuthorizeRepay(),
      speculosAppName,
      signOnDevice,
      () => this.expectRepayExecutionCompleted(),
    );
  }

  @Step("Authorize withdrawal with on-chain retry")
  async authorizeWithdrawWithRetry(speculosAppName: string, signOnDevice: () => Promise<void>) {
    await this.authorizeExecutionWithRetry(
      () => this.clickAuthorizeWithdraw(),
      speculosAppName,
      signOnDevice,
      () => this.expectWithdrawExecutionCompleted(),
    );
  }

  private async authorizeExecutionWithRetry(
    clickAuthorize: () => Promise<void>,
    speculosAppName: string,
    signOnDevice: () => Promise<void>,
    expectComplete: () => Promise<void>,
  ) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await clickAuthorize();
      await this.completeHostDeviceSignature(speculosAppName, signOnDevice);

      if (await this.clickExecutionTryAgainIfVisible(15_000)) {
        continue;
      }

      try {
        await expectComplete();
        return;
      } catch (error) {
        if (attempt === 0 && (await this.clickExecutionTryAgainIfVisible(30_000))) {
          continue;
        }
        throw error;
      }
    }
  }

  private async expectHotStartLoansDashboard() {
    if (await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)) {
      const dismissed = await this.dismissIntroModalForHotStart();
      if (!dismissed) {
        throw new Error("Borrow hot start: intro modal blocked the loans dashboard");
      }
    }

    await waitWebElementByTestId(this.loansDashboardId, { timeout: 60_000 });
    await waitWebElementByTestId(this.loanDashboardRowId, { timeout: 60_000 });
  }

  /** Close intro on hot start (existing loan). Do not tap "Simulate my loan". */
  private async dismissIntroModalForHotStart(): Promise<boolean> {
    if (!(await waitWebElementByTestId(this.introModalId, this.webTestIdProbe))) {
      return false;
    }

    if (await this.tryDismissIntroModalByTestId()) {
      return true;
    }

    // Fallback until borrow-live-app exposes borrow-intro-modal-close.
    try {
      await tapWebElementByElement(getWebElementByXpath(this.introModalCloseFallbackXpath), 3_000);
      await this.waitUntil(
        async () => !(await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)),
        10_000,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async tryDismissIntroModalByTestId(): Promise<boolean> {
    try {
      await waitWebElementByTestId(this.introModalCloseButtonId, {
        timeout: 2_000,
        throwOnTimeout: true,
      });
      await tapWebElementByTestId(this.introModalCloseButtonId);
      await this.waitUntil(
        async () => !(await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)),
        10_000,
      );
      return true;
    } catch {
      return false;
    }
  }

  @Step("Click the active loan on the dashboard")
  async clickActiveLoanDashboardRow() {
    await waitWebElementByTestId(this.loanDashboardRowId, { timeout: 60_000 });
    await tapWebElementByTestId(this.loanDashboardRowId, { index: 0 });
    await this.waitForLoanOverviewReady();
  }

  @Step("Click the repaid loan on the dashboard")
  async clickRepaidLoanDashboardRow() {
    await waitWebElementByTestId(this.loanDashboardRowId, { timeout: 60_000 });
    await tapWebElementByTestId(this.loanDashboardRowId, { index: 0 });
    await waitForCurrentWebviewUrlToContain("/withdrawoverview/", 20_000);
    await waitForWebElementToBeEnabled(this.withdrawCollateralButtonId, 60_000);
  }

  private async waitForLoanOverviewReady(): Promise<void> {
    await waitForCurrentWebviewUrlToContain("/loanoverview/", 20_000);
    // Overview wrapper test id is not always mounted; Repay CTA is the stable marker (desktop parity).
    await waitForWebElementToBeEnabled(this.repayButtonId, 60_000);
  }

  @Step("Click Repay on loan overview")
  async clickRepay() {
    await waitForWebElementToBeEnabled(this.repayButtonId);
    await tapWebElementByTestId(this.repayButtonId);
    await waitWebElementByTestId(this.repayModalId);
  }

  @Step("Repay in full and continue to execution")
  async submitRepayInFull() {
    await waitForWebElementToBeEnabled(this.repayInFullButtonId);
    await tapWebElementByTestId(this.repayInFullButtonId);
    await waitForWebElementToBeEnabled(this.repayContinueButtonId, 30_000);
    await tapWebElementByTestId(this.repayContinueButtonId);
    await waitForCurrentWebviewUrlToContain("/forms/repay/");
    await waitWebElementByTestId(this.repayExecutionScreenId);
  }

  @Step("Click Authorize repayment")
  async clickAuthorizeRepay() {
    await waitWebElementByTestId(this.repayExecutionScreenId, { timeout: 60_000 });
    await this.tapAuthorizeButtonWhenReady(
      this.authorizeRepayButtonId,
      this.authorizeRepayFallbackXpath,
    );
  }

  @Step("Wait for repay execution to complete")
  async expectRepayExecutionCompleted() {
    await this.expectFlowComplete(
      [this.repayStep2RepayDoneId, this.repayCompletionCardId, this.viewMyLoanButtonId],
      "Repay execution",
    );
  }

  @Step("Verify repay success screen")
  async expectRepaySuccess() {
    await waitWebElementByTestId(this.repayCompletionCardId, { timeout: 60_000 });
    await detoxExpect(getWebElementByTestId(this.viewMyLoanButtonId)).toExist();
  }

  @Step("Click Withdraw collateral on overview")
  async clickWithdrawCollateral() {
    await waitForWebElementToBeEnabled(this.withdrawCollateralButtonId, 60_000);
    await tapWebElementByTestId(this.withdrawCollateralButtonId);
    await waitForCurrentWebviewUrlToContain("/forms/withdraw/", 60_000);
    await waitWebElementByTestId(this.withdrawExecutionScreenId, { timeout: 60_000 });
  }

  @Step("Click Authorize withdrawal")
  async clickAuthorizeWithdraw() {
    await waitWebElementByTestId(this.withdrawExecutionScreenId, { timeout: 60_000 });
    await this.tapAuthorizeButtonWhenReady(
      this.authorizeWithdrawButtonId,
      this.authorizeWithdrawFallbackXpath,
    );
  }

  @Step("Wait for withdraw execution to complete")
  async expectWithdrawExecutionCompleted() {
    await this.expectFlowComplete(
      [this.withdrawStepDoneId, this.withdrawCompletionCardId, this.backToMyLoansButtonId],
      "Withdraw execution",
    );
  }

  @Step("Verify withdraw success screen")
  async expectWithdrawSuccess() {
    await waitWebElementByTestId(this.withdrawCompletionCardId, { timeout: 60_000 });
    await detoxExpect(getWebElementByTestId(this.backToMyLoansButtonId)).toExist();
  }

  /** Spec-level visibility checks (Sonar S2699). Call after the matching expect* step. */
  async isIntroModalShown(): Promise<boolean> {
    return !!(await waitWebElementByTestId(this.introModalId, this.webTestIdProbe));
  }

  async isLoanCompletionShown(): Promise<boolean> {
    return !!(await waitWebElementByTestId(this.loanCompletionCardId, this.webTestIdProbe));
  }

  async isRepayCompletionShown(): Promise<boolean> {
    return !!(await waitWebElementByTestId(this.repayCompletionCardId, this.webTestIdProbe));
  }

  async isWithdrawCompletionShown(): Promise<boolean> {
    return !!(await waitWebElementByTestId(this.withdrawCompletionCardId, this.webTestIdProbe));
  }

  private async isLoansDashboardReady(): Promise<boolean> {
    if (await waitWebElementByTestId(this.loansDashboardId, this.webTestIdProbe)) {
      return true;
    }

    return !!(
      (await waitWebElementByTestId(this.yourLoansTitleId, this.webTestIdProbe)) &&
      (await waitWebElementByTestId(this.loanDashboardRowId, this.webTestIdProbe))
    );
  }

  @Step("Click Back to my loans")
  async clickBackToMyLoans() {
    await tapWebElementByTestId(this.backToMyLoansButtonId);

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await this.isLoansDashboardReady()) {
        return;
      }
      // Full withdraw closes the position — borrow routes to simulate-loan / intro (no loans left).
      if (await this.isBorrowEmptyStateReady()) {
        return;
      }
      await this.pollInterval();
    }

    const url = await getCurrentWebviewUrl();
    throw new Error(`Borrow post-withdraw landing not ready after back to my loans (url: ${url})`);
  }

  private async isBorrowEmptyStateReady(): Promise<boolean> {
    const url = (await getCurrentWebviewUrl()).toLowerCase();
    if (url.includes("/loan/simulate-loan")) {
      return !!(
        (await waitWebElementByTestId(this.simulateLoanScreenId, this.webTestIdProbe)) ||
        (await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)) ||
        (await waitWebElementByTestId(this.loanAmountInputId, this.webTestIdProbe))
      );
    }

    return !!(
      (await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)) ||
      (await waitWebElementByTestId(this.getNewLoanButtonId, this.webTestIdProbe))
    );
  }

  @Step("Click Try again on borrow execution error")
  async clickExecutionTryAgainIfVisible(timeoutMs = 60_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.isNativeBorrowErrorBottomSheetVisible()) {
        await tapById(this.borrowErrorBottomSheetCtaId);
        await this.waitUntil(
          async () => !(await this.isNativeBorrowErrorBottomSheetVisible()),
          15_000,
        );
        return true;
      }

      try {
        const tryAgain = getWebElementByXpath(this.tryAgainButtonXpath);
        await waitWebElement(tryAgain, 2_000, false);
        await tapWebElementByElement(tryAgain);
        return true;
      } catch {
        // Web inline / dialog error not shown.
      }

      await this.pollInterval();
    }
    return false;
  }

  private async isNativeBorrowErrorBottomSheetVisible(): Promise<boolean> {
    try {
      await waitForElementById(this.borrowErrorBottomSheetCtaId, 2_000);
      return true;
    } catch {
      return false;
    }
  }

  private async pollInterval(delayMs = 500): Promise<void> {
    await delay(delayMs);
  }

  private async waitUntil(
    condition: () => Promise<boolean>,
    timeoutMs: number,
    pollMs = 500,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await condition()) return;
      await this.pollInterval(pollMs);
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  private async clickGiveApprovalWhenReady(
    stepDoneId: string,
    giveApprovalId: string,
    nextAuthorizeId: string,
    stepLabel: string,
  ): Promise<boolean> {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await waitWebElementByTestId(stepDoneId, this.webTestIdProbe)) return false;
      if (await this.isWebElementEnabledByTestId(nextAuthorizeId)) return false;
      if (
        (await waitWebElementByTestId(giveApprovalId, this.webTestIdProbe)) &&
        (await this.isWebElementEnabledByTestId(giveApprovalId))
      ) {
        await tapWebElementByTestId(giveApprovalId);
        return true;
      }
      await this.pollInterval();
    }
    if (await waitWebElementByTestId(stepDoneId, this.webTestIdProbe)) return false;
    if (await this.isWebElementEnabledByTestId(nextAuthorizeId)) return false;
    throw new Error(
      `${stepLabel}: give approval did not become clickable or auto-complete within 60s`,
    );
  }

  private async isWebElementEnabledByTestId(testId: string): Promise<boolean> {
    try {
      await waitWebElementByTestId(testId, { timeout: 2_000, throwOnTimeout: true });
      await waitForWebElementToBeEnabled(testId, 500);
      return true;
    } catch {
      return false;
    }
  }

  /** Partner tx prep can take ~2 min on mainnet; button may render before data-testid is attached. */
  private async tapAuthorizeButtonWhenReady(testId: string, fallbackXpath: string): Promise<void> {
    const deadline = Date.now() + this.executionStepTimeoutMs;

    while (Date.now() < deadline) {
      if (await this.isWebElementEnabledByTestId(testId)) {
        await tapWebElementByTestId(testId);
        return;
      }

      try {
        const button = getWebElementByXpath(fallbackXpath);
        await waitWebElement(button, 2_000, false);
        if (await WebElementHelpers.isWebElementEnabled(button)) {
          await tapWebElementByElement(button);
          return;
        }
      } catch {
        // Partner still preparing the tx — button shows a loading spinner.
      }

      await this.pollInterval();
    }

    throw new Error(
      `Authorize button did not become enabled within ${this.executionStepTimeoutMs}ms`,
    );
  }

  private async isExecutionErrorVisible(): Promise<boolean> {
    if (await this.isNativeBorrowErrorBottomSheetVisible()) {
      return true;
    }

    return !!(
      (await waitWebElementByTestId(this.executionErrorId, this.webTestIdProbe)) ||
      (await waitWebElementByTestId(this.onChainFailedMessageId, this.webTestIdProbe))
    );
  }

  private async expectExecutionStepOutcome(doneTestId: string, stepLabel: string) {
    await this.expectFlowComplete([doneTestId], `Borrow execution step (${stepLabel})`);
  }

  private async expectFlowComplete(successTestIds: string[], stepLabel: string) {
    const deadline = Date.now() + this.executionStepTimeoutMs;
    while (Date.now() < deadline) {
      for (const testId of successTestIds) {
        if (await waitWebElementByTestId(testId, this.webTestIdProbe)) return;
      }
      if (await this.isExecutionErrorVisible()) {
        throw new Error(`${stepLabel} failed in webview. ${MAINNET_FUNDING_HINT}`);
      }
      await this.pollInterval();
    }

    if (await this.isExecutionErrorVisible()) {
      throw new Error(`${stepLabel} failed in webview. ${MAINNET_FUNDING_HINT}`);
    }

    throw new Error(`${stepLabel} timed out after ${this.executionStepTimeoutMs}ms`);
  }
}
