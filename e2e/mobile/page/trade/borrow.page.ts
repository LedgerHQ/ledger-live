import { Step } from "jest-allure2-reporter/api";
import { delay, isAndroid } from "../../helpers/commonHelpers";
import { WebElementHelpers } from "../../helpers/elementHelpers";
import { refreshSpeculosForSigning } from "../../utils/speculosUtils";

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

  /** XPath fallbacks when testids are missing or not yet mounted (borrow-live-app gaps). */
  private readonly introModalCloseFallbackXpath =
    "//*[@data-testid='borrow-intro-modal']//button[contains(@aria-label, 'Close') or contains(@aria-label, 'close')]";
  private readonly viewMyLoanFallbackXpath =
    "//*[(self::button or @role='button') and contains(normalize-space(.), 'View my loan')]";
  private readonly tryAgainButtonXpath = "//button[contains(., 'Try again')]";
  private readonly authorizeRepayFallbackXpath =
    "//*[(self::button or @role='button') and contains(normalize-space(.), 'Authorize repayment')]";
  private readonly authorizeWithdrawFallbackXpath =
    "//*[(self::button or @role='button') and contains(normalize-space(.), 'Authorize withdrawal')]";
  private readonly simulateLoanKeypadDigitXpathTemplate =
    "//*[@data-testid='borrow-simulate-loan-screen']//*[(self::button or @role='button') and normalize-space(.)='%s']";

  @Step("Expect borrow native screen visible")
  async expectBorrowScreenVisible() {
    await waitForElementById(this.borrowScreenId);
    await waitForElementById(app.common.walletApiWebview, undefined, { checkVisibility: false });
    await waitForWebviewContentToRender();
  }

  @Step("Go and wait for Borrow cold-start entry")
  async goAndWaitForBorrowColdStart(entryFn: () => Promise<void>) {
    await entryFn();
    await this.expectBorrowScreenVisible();
  }

  @Step("Verify Introducing Crypto Loan modal is visible")
  async verifyIntroModalVisible() {
    await waitWebElementByTestId(this.introModalId);
    await detoxExpect(getWebElementByTestId(this.introModalId)).toExist();
    await detoxExpect(getWebElementByTestId(this.introModalTitleId)).toExist();
  }

  @Step("Go and wait for Borrow simulate-loan screen")
  async goAndWaitForBorrowToBeReady(entryFn: () => Promise<void>) {
    await entryFn();
    await this.expectBorrowScreenVisible();
    await this.ensureSimulateLoanScreen();
  }

  private async ensureSimulateLoanScreen() {
    try {
      await waitForCurrentWebviewUrlToContain("/loan/simulate-loan", 5_000);
      await waitWebElementByTestId(this.simulateLoanScreenId);
      return;
    } catch {
      // fall through to intro / get-new-loan handling
    }

    const introModal = await waitWebElementByTestId(this.introModalId, {
      timeout: 60_000,
      throwOnTimeout: false,
    });
    if (introModal) {
      await this.clickSimulateMyLoan();
      return;
    }

    await waitForWebElementToBeEnabled(this.getNewLoanButtonId, 60_000);
    await tapWebElementByTestId(this.getNewLoanButtonId);
    await waitForCurrentWebviewUrlToContain("/loan/simulate-loan");
    await waitWebElementByTestId(this.simulateLoanScreenId);
  }

  @Step("Dismiss intro modal if shown and wait for simulate screen")
  async dismissIntroModalIfVisible() {
    if (await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)) {
      await this.clickSimulateMyLoan();
      return;
    }
    await waitWebElementByTestId(this.loanAmountInputId);
  }

  @Step("Click Simulate my loan on intro modal")
  async clickSimulateMyLoan() {
    await waitForWebElementToBeEnabled(this.simulateMyLoanButtonId);
    await tapWebElementByTestId(this.simulateMyLoanButtonId);
    await waitForCurrentWebviewUrlToContain("/loan/simulate-loan");
    await waitWebElementByTestId(this.simulateLoanScreenId);
  }

  @Step("Type loan amount")
  async typeLoanAmount(amount: string) {
    await waitWebElementByTestId(this.simulateLoanScreenId);
    await waitWebElementByTestId(this.loanAmountInputId);
    await tapWebElementByTestId(this.loanAmountInputId);

    if (isAndroid()) {
      for (const digit of amount) {
        await this.tapSimulateLoanKeypadDigit(digit);
      }
    } else {
      await typeTextByWebTestId(this.loanAmountInputId, amount);
    }

    await waitForWebElementToBeEnabled(
      this.simulateContinueButtonId,
      this.simulateContinueReadyTimeoutMs,
    );
  }

  private simulateLoanKeypadDigitXpath(digit: string): string {
    return this.simulateLoanKeypadDigitXpathTemplate.replace("%s", digit);
  }

  private async tapSimulateLoanKeypadDigit(digit: string) {
    await tapWebElementByElement(
      getWebElementByXpath(this.simulateLoanKeypadDigitXpath(digit)),
      5_000,
    );
  }

  @Step("Click Continue on simulate loan")
  async clickContinue() {
    await waitForWebElementToBeEnabled(
      this.simulateContinueButtonId,
      this.simulateContinueReadyTimeoutMs,
    );
    await tapWebElementByTestId(this.simulateContinueButtonId);
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

  @Step("Go and wait for Borrow hot-start dashboard")
  async goAndWaitForBorrowHotStart(
    entryFn: () => Promise<void>,
    options?: { acceptWithdrawOverview?: boolean },
  ) {
    await entryFn();
    await this.expectBorrowScreenVisible();
    await this.ensureLoansDashboard(options?.acceptWithdrawOverview ?? false);
  }

  private async ensureLoansDashboard(acceptWithdrawOverview: boolean) {
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      if (acceptWithdrawOverview && (await this.isWithdrawOverviewReady())) {
        return;
      }

      if (await this.isLoansDashboardReady()) {
        return;
      }

      if (await this.dismissIntroModalForHotStart()) {
        continue;
      }

      await this.recoverFromStaleBorrowWebview();
      await this.pollInterval();
    }

    const url = await getCurrentWebviewUrl();
    throw new Error(`Borrow loans dashboard not ready after 60s (url: ${url})`);
  }

  @Step("Go and wait for Borrow withdraw hot-start")
  async goAndWaitForWithdrawHotStart(entryFn: () => Promise<void>) {
    await entryFn();
    await this.expectBorrowScreenVisible();

    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      if (await this.isWithdrawEntryReady()) {
        return;
      }

      if (await this.tryOpenWithdrawFromLoansDashboard()) {
        return;
      }

      if (await this.dismissIntroModalForHotStart()) {
        continue;
      }

      await this.recoverFromStaleBorrowWebview();
      await this.pollInterval();
    }

    await this.waitForWithdrawEntryReady();
  }

  private async tryOpenWithdrawFromLoansDashboard(): Promise<boolean> {
    if (!(await this.isLoansDashboardReady())) {
      return false;
    }

    await tapWebElementByTestId(this.loanDashboardRowId, { index: 0 });
    if (await this.pollUntilWithdrawEntryReady(30_000)) {
      return true;
    }

    await this.reopenBorrowFromPortfolio();
    return false;
  }

  private async pollUntilWithdrawEntryReady(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.isWithdrawEntryReady()) {
        return true;
      }
      await this.pollInterval();
    }

    return this.isWithdrawEntryReady();
  }

  private async recoverFromStaleBorrowWebview(): Promise<void> {
    if (await this.dismissIntroModalForHotStart()) {
      return;
    }

    if (
      (await waitWebElementByTestId(this.repayCompletionCardId, this.webTestIdProbe)) ||
      (await waitWebElementByTestId(this.loanCompletionCardId, this.webTestIdProbe))
    ) {
      await this.tapViewMyLoanIfVisible();
      return;
    }

    const url = (await getCurrentWebviewUrl()).toLowerCase();
    if (url.includes("/forms/repay/") || url.includes("repay")) {
      await this.tapViewMyLoanIfVisible();
      return;
    }

    if ((await this.isLoansDashboardReady()) || (await this.isWithdrawEntryReady())) {
      return;
    }

    if (await waitWebElementByTestId(this.introModalId, this.webTestIdProbe)) {
      return;
    }

    await this.reopenBorrowFromPortfolio();
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

  private async tapViewMyLoanIfVisible(): Promise<void> {
    if (await waitWebElementByTestId(this.viewMyLoanButtonId, this.webTestIdProbe)) {
      await tapWebElementByTestId(this.viewMyLoanButtonId);
      await this.waitUntil(
        async () =>
          (await this.isLoansDashboardReady()) ||
          (await this.isWithdrawEntryReady()) ||
          !(await waitWebElementByTestId(this.viewMyLoanButtonId, this.webTestIdProbe)),
        15_000,
      );
      return;
    }

    try {
      const viewMyLoan = getWebElementByXpath(this.viewMyLoanFallbackXpath);
      await tapWebElementByElement(viewMyLoan, 5_000);
      await this.waitUntil(
        async () =>
          (await this.isLoansDashboardReady()) ||
          (await this.isWithdrawEntryReady()) ||
          !(await waitWebElementByTestId(this.loanCompletionCardId, this.webTestIdProbe)),
        15_000,
      );
    } catch {
      // No view-my-loan affordance on the current borrow webview route.
    }
  }

  private async reopenBorrowFromPortfolio(): Promise<void> {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.portfolio.expectBorrowEntryPointVisible();
    await app.portfolio.clickBorrowEntryPoint();
    await this.expectBorrowScreenVisible();
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

  private async isWithdrawOverviewReady(): Promise<boolean> {
    try {
      await waitForCurrentWebviewUrlToContain("/withdrawoverview/", 2_000);
      return this.isWebElementEnabledByTestId(this.withdrawCollateralButtonId);
    } catch {
      return false;
    }
  }

  private async isWithdrawEntryReady(): Promise<boolean> {
    if (await this.isWithdrawOverviewReady()) {
      return true;
    }

    try {
      await waitForCurrentWebviewUrlToContain("/loanoverview/", 2_000);
      return this.isWebElementEnabledByTestId(this.withdrawCollateralButtonId);
    } catch {
      return false;
    }
  }

  private async waitForWithdrawEntryReady(): Promise<void> {
    if (await this.isWithdrawOverviewReady()) {
      return;
    }

    await waitForCurrentWebviewUrlToContain("/loanoverview/", 20_000);
    await waitForWebElementToBeEnabled(this.withdrawCollateralButtonId, 60_000);
  }

  @Step("Click the active loan on the dashboard")
  async clickActiveLoanDashboardRow() {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!(await this.isLoansDashboardReady())) {
        await this.reopenBorrowFromPortfolio();
      }

      await waitWebElementByTestId(this.loanDashboardRowId, { timeout: 60_000 });
      await tapWebElementByTestId(this.loanDashboardRowId, { index: 0 });
      try {
        await this.waitForLoanOverviewReady();
        return;
      } catch (error) {
        if (attempt === 3) {
          throw error;
        }
        await this.reopenBorrowFromPortfolio();
      }
    }
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
      try {
        const tryAgain = getWebElementByXpath(this.tryAgainButtonXpath);
        await waitWebElement(tryAgain, 2_000, false);
        await tapWebElementByElement(tryAgain);
        return true;
      } catch {
        if (await this.isExecutionErrorVisible()) {
          await this.pollInterval();
          continue;
        }
        return false;
      }
    }
    return false;
  }

  /**
   * Authorize → sign → wait for step completion. On on-chain failure, tap Try again and retry
   * (Try again may reopen native Send summary — see retryAfterOnChainFailure).
   */
  @Step("Complete authorize execution with on-chain retry")
  async completeAuthorizeExecutionWithRetry(options: {
    speculosAppName: string;
    clickAuthorize: () => Promise<void>;
    authorizeButtonId: string;
    signOnDevice: () => Promise<void>;
    expectComplete: () => Promise<void>;
    maxAttempts?: number;
  }): Promise<void> {
    const maxAttempts = options.maxAttempts ?? 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await options.clickAuthorize();
      await this.completeHostDeviceSignature(options.speculosAppName, options.signOnDevice);
      try {
        await options.expectComplete();
        return;
      } catch (error) {
        const retriable =
          attempt < maxAttempts - 1 &&
          error instanceof Error &&
          error.message.includes("failed in webview");
        if (!retriable) throw error;
        if (
          !(await this.retryAfterOnChainFailure(
            options.speculosAppName,
            options.signOnDevice,
            options.authorizeButtonId,
          ))
        ) {
          throw error;
        }
      }
    }
  }

  private async retryAfterOnChainFailure(
    speculosAppName: string,
    signOnDevice: () => Promise<void>,
    authorizeButtonId: string,
  ): Promise<boolean> {
    if (!(await this.clickExecutionTryAgainIfVisible())) return false;
    await this.pollInterval(1_000);

    if (await this.isSendSummaryContinueVisible()) {
      await this.completeHostDeviceSignature(speculosAppName, signOnDevice);
      return true;
    }

    if (await this.isWebElementEnabledByTestId(authorizeButtonId)) {
      await tapWebElementByTestId(authorizeButtonId);
    }
    await this.completeHostDeviceSignature(speculosAppName, signOnDevice);
    return true;
  }

  private async isSendSummaryContinueVisible(): Promise<boolean> {
    try {
      await waitForElementById(app.send.summaryContinueEnabledButtonId, 5_000);
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
