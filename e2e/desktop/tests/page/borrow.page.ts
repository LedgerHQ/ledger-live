import { expect, type Locator, type Page } from "@playwright/test";
import { peekBorrowAddress, readAccountNonces } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";

const FUNDING_HINT =
  "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

const EXECUTION_TIMEOUT_MS = 240_000;
const APPROVAL_TIMEOUT_MS = 60_000;
const SCREEN_TIMEOUT_MS = 60_000;

export class BorrowPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "borrow";

  private readonly borrowRoutePattern = /\/borrow/;
  private readonly simulateLoanRoutePattern = /\/loan\/simulate-loan/;
  private readonly loanExecutionRoutePattern = /\/loan\/loan-execution/;
  private readonly loanOverviewRoutePattern = /\/loanoverview\//;
  private readonly repayExecutionRoutePattern = /\/forms\/repay\/[^/]+\/execute/;
  private readonly withdrawOverviewRoutePattern = /\/withdrawoverview\//;
  private readonly withdrawExecutionRoutePattern = /\/forms\/withdraw\//;
  private readonly introModal = "borrow-intro-modal";
  private readonly introModalTitle = "borrow-intro-modal-title";
  private readonly simulateMyLoan = "borrow-simulate-my-loan-button";
  private readonly simulateLoanScreen = "borrow-simulate-loan-screen";
  private readonly loanAmountInput = "borrow-loan-amount-input";
  private readonly simulateContinue = "borrow-simulate-continue-button";
  private readonly getNewLoan = "borrow-get-new-loan-button";
  private readonly loanExecutionScreen = "borrow-loan-execution-screen";
  private readonly giveApproval = "give-approval-button";
  private readonly authorizeDepositing = "borrow-authorize-depositing-button";
  private readonly authorizeBorrowing = "borrow-authorize-borrowing-button";
  private readonly step1AccessApproved = "borrow-step-1-access-approved";
  private readonly step2DepositDone = "borrow-step-2-deposit-done";
  private readonly step3BorrowDone = "borrow-step-3-borrow-done";
  private readonly executionErrorDialog = "borrow-execution-error";
  private readonly onChainFailedMessage = "borrow-on-chain-failed-message";
  private readonly loanCompletionCard = "borrow-loan-completion-card";
  private readonly viewMyLoan = "borrow-view-my-loan-button";
  private readonly yourLoansTitle = "borrow-your-loans-title";
  private readonly loansDashboard = "borrow-loans-dashboard";
  private readonly loanDashboardRow = "borrow-loan-dashboard-row";
  private readonly loanOverviewScreen = "borrow-loan-overview-screen";
  private readonly repayButton = "borrow-repay-button";
  private readonly repayModal = "borrow-repay-modal";
  private readonly repayInFull = "borrow-repay-in-full-button";
  private readonly repayContinue = "borrow-repay-continue-button";
  private readonly repayExecutionScreen = "borrow-repay-execution-screen";
  private readonly authorizeRepay = "borrow-authorize-repay-button";
  private readonly repayStep1AccessApproved = "borrow-repay-step-1-access-approved";
  private readonly repayStep2Done = "borrow-repay-step-2-repay-done";
  private readonly repayCompletionCard = "borrow-repay-completion-card";
  private readonly withdrawOverviewScreen = "borrow-withdraw-overview-screen";
  private readonly withdrawCollateral = "borrow-withdraw-collateral-button";
  private readonly withdrawExecutionScreen = "borrow-withdraw-execution-screen";
  private readonly authorizeWithdraw = "borrow-authorize-withdraw-button";
  private readonly withdrawStepDone = "borrow-withdraw-step-done";
  private readonly withdrawCompletionCard = "borrow-withdraw-completion-card";
  private readonly backToMyLoans = "borrow-back-to-my-loans-button";
  private readonly hostSignModalTextPattern = /Approve token|Sign transaction/i;
  private readonly signAmountContinueBtn = this.page.locator(
    "#sign-transaction-amount-continue-button",
  );
  private readonly signSummaryContinueBtn = this.page.locator("#sign-summary-continue-button");
  private readonly deviceTransactionConfirm = this.page.getByTestId(
    "device-action-transaction-confirm",
  );
  private readonly modalBackdrop = this.page.getByTestId("modal-backdrop");
  private readonly hostSignModal = this.page.getByTestId("modal-container").filter({
    has: this.page.getByText(this.hostSignModalTextPattern),
  });
  private readonly hostSignModalContinueBtn = this.hostSignModal.getByRole("button", {
    name: "Continue",
  });

  private errorLocators(webview: Page): Locator[] {
    return [
      webview.getByTestId(this.executionErrorDialog),
      webview.getByTestId(this.onChainFailedMessage),
    ];
  }

  private async isAnyVisible(locators: Locator[]): Promise<boolean> {
    for (const locator of locators) {
      if (await locator.first().isVisible()) return true;
    }
    return false;
  }

  private async expectAnyVisible(
    locators: Locator[],
    timeout: number,
    message: string,
  ): Promise<void> {
    await expect.poll(() => this.isAnyVisible(locators), { timeout, message }).toBe(true);
  }

  private async isReady(locator: Locator): Promise<boolean> {
    return (await locator.isVisible()) && (await locator.isEnabled());
  }

  private async clickWhenEnabled(testId: string) {
    const webview = await this.getWebView();
    const button = webview.getByTestId(testId);
    await expect(button).toBeEnabled();
    await button.click();
  }

  private async chainState(): Promise<string> {
    const address = peekBorrowAddress();
    if (!address) return FUNDING_HINT;
    try {
      const { latest, pending } = await readAccountNonces(address);
      if (pending > latest) {
        return (
          `Account ${address} is at nonce ${latest} with ${pending - latest} transaction(s) in ` +
          `flight — another process is spending from it, so the app's transaction was very likely ` +
          `dropped.`
        );
      }
      return (
        `Account ${address} is at nonce ${latest} with nothing in flight. If the app signed a ` +
        `lower nonce its transaction was dropped — compare transactionSequenceNumber in logs.log. ` +
        FUNDING_HINT
      );
    } catch (error) {
      return `Could not read chain state for ${address} (${error}). ${FUNDING_HINT}`;
    }
  }

  private async expectFlowComplete(
    webview: Page,
    success: Locator[],
    label: string,
  ): Promise<void> {
    const errors = this.errorLocators(webview);
    try {
      await this.expectAnyVisible(
        [...success, ...errors],
        EXECUTION_TIMEOUT_MS,
        `${label}: neither success nor an error appeared`,
      );
    } catch {
      throw new Error(
        `${label}: neither success nor an error appeared within ${EXECUTION_TIMEOUT_MS}ms, the ` +
          `webview is stuck. ${await this.chainState()}`,
      );
    }
    if (await this.isAnyVisible(success)) return;
    throw new Error(`${label} failed in webview. ${await this.chainState()}`);
  }

  @step("Go and wait for Borrow cold-start entry")
  async goAndWaitForBorrowColdStart(entryFn: () => Promise<void>) {
    await this.enterBorrow(entryFn);
  }

  @step("Go and wait for Borrow app simulate-loan screen")
  async goAndWaitForBorrowToBeReady(entryFn: () => Promise<void>) {
    const webview = await this.enterBorrow(entryFn);
    await this.ensureSimulateLoanScreen(webview);
  }

  @step("Go and wait for Borrow hot-start dashboard")
  async goAndWaitForBorrowHotStart(entryFn: () => Promise<void>) {
    const webview = await this.enterBorrow(entryFn);
    await expect(webview.getByTestId(this.loansDashboard)).toBeVisible({
      timeout: SCREEN_TIMEOUT_MS,
    });
  }

  private async enterBorrow(entryFn: () => Promise<void>): Promise<Page> {
    this._webviewPage = undefined;
    await entryFn();
    await expect(this.page).toHaveURL(this.borrowRoutePattern);
    return this.getWebView();
  }

  private async ensureSimulateLoanScreen(webview: Page) {
    if (this.simulateLoanRoutePattern.test(webview.url())) {
      await expect(webview.getByTestId(this.simulateLoanScreen)).toBeVisible();
      return;
    }

    const introModal = webview.getByTestId(this.introModal);
    const getNewLoan = webview.getByTestId(this.getNewLoan);
    await expect(introModal.or(getNewLoan)).toBeVisible({ timeout: SCREEN_TIMEOUT_MS });

    if (await introModal.isVisible()) {
      await this.clickSimulateMyLoan();
      return;
    }

    await getNewLoan.click();
    await expect(webview).toHaveURL(this.simulateLoanRoutePattern);
    await expect(webview.getByTestId(this.simulateLoanScreen)).toBeVisible();
  }

  @step("Verify Introducing Crypto Loan modal is visible")
  async verifyIntroModalVisible() {
    await this.verifyElementIsVisible(this.introModal);
    await this.verifyElementIsVisible(this.introModalTitle);
  }

  @step("Dismiss intro modal if shown and wait for simulate screen")
  async dismissIntroModalIfVisible() {
    const webview = await this.getWebView();
    if (await webview.getByTestId(this.introModal).isVisible()) {
      await this.clickSimulateMyLoan();
      return;
    }
    await expect(webview.getByTestId(this.loanAmountInput)).toBeVisible();
  }

  @step("Click Simulate my loan")
  async clickSimulateMyLoan() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.simulateMyLoan).click();
    await expect(webview.getByTestId(this.introModal)).toBeHidden();
    await expect(webview.getByTestId(this.loanAmountInput)).toBeVisible();
  }

  @step("Type loan amount")
  async typeLoanAmount(digits: string) {
    await this.setValue(this.loanAmountInput, digits);
  }

  @step("Click Continue")
  async clickContinue() {
    await this.clickWhenEnabled(this.simulateContinue);
  }

  @step("Verify loan execution flow is visible")
  async expectExecutionFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(this.loanExecutionRoutePattern);
    await expect(webview.getByTestId(this.loanExecutionScreen)).toBeVisible();
    await this.expectAnyVisible(
      [webview.getByTestId(this.giveApproval), webview.getByTestId(this.authorizeDepositing)],
      SCREEN_TIMEOUT_MS,
      "Loan execution flow never showed Give approval or Authorize depositing",
    );
  }

  private async completeApprovalIfRequired(
    screenTestId: string,
    stepDoneTestId: string,
    authorizeTestId: string,
    label: string,
  ): Promise<boolean> {
    const webview = await this.getWebView();
    const screen = webview.getByTestId(screenTestId);
    await expect(screen).toBeVisible();

    const stepDone = screen.getByTestId(stepDoneTestId);
    const giveApproval = webview.getByTestId(this.giveApproval);
    const authorize = webview.getByTestId(authorizeTestId);

    await this.expectAnyVisible(
      [stepDone, giveApproval, authorize],
      APPROVAL_TIMEOUT_MS,
      `${label}: the execution flow never showed a step to act on`,
    );

    if (await stepDone.isVisible()) return false;

    if (await giveApproval.isVisible()) {
      try {
        await expect(giveApproval).toBeEnabled({ timeout: APPROVAL_TIMEOUT_MS });
      } catch {
        if (await stepDone.isVisible()) return false;
        if (await this.isReady(authorize)) return false;
        throw new Error(`${label}: Give approval stayed disabled for ${APPROVAL_TIMEOUT_MS}ms`);
      }
      await giveApproval.click();
      return true;
    }

    if (await this.isReady(authorize)) return false;
    throw new Error(`${label}: neither Give approval nor the next authorize step became ready`);
  }

  @step("Complete Give approval step if required")
  async completeGiveApprovalIfRequired(): Promise<boolean> {
    return this.completeApprovalIfRequired(
      this.loanExecutionScreen,
      this.step1AccessApproved,
      this.authorizeDepositing,
      "Open loan Step 1 approval",
    );
  }

  @step("Complete repay Give approval step if required")
  async completeRepayGiveApprovalIfRequired(): Promise<boolean> {
    return this.completeApprovalIfRequired(
      this.repayExecutionScreen,
      this.repayStep1AccessApproved,
      this.authorizeRepay,
      "Repay Step 1 approval",
    );
  }

  @step("Click Authorize depositing")
  async clickAuthorizeDepositing() {
    await this.clickWhenEnabled(this.authorizeDepositing);
  }

  @step("Click Authorize borrowing")
  async clickAuthorizeBorrowing() {
    await this.clickWhenEnabled(this.authorizeBorrowing);
  }

  @step("Click Authorize repayment")
  async clickAuthorizeRepay() {
    await this.clickWhenEnabled(this.authorizeRepay);
  }

  @step("Click Authorize withdrawal")
  async clickAuthorizeWithdraw() {
    const webview = await this.getWebView();
    if (await webview.getByTestId(this.executionErrorDialog).first().isVisible()) {
      throw new Error(
        `borrow-execution-error dialog is visible before authorize withdraw — Speculos or provider state is inconsistent. ${FUNDING_HINT}`,
      );
    }
    const button = webview.getByTestId(this.authorizeWithdraw);
    await expect(button).toBeEnabled();
    await button.click();
  }

  @step("Click Continue on host sign modal")
  async clickSignSummaryContinue() {
    await expect(this.hostSignModal).toBeVisible();

    for (let step = 0; step < 2; step++) {
      if (await this.signSummaryContinueBtn.isVisible()) {
        await expect(this.signSummaryContinueBtn).toBeEnabled();
        await this.signSummaryContinueBtn.click();
        await expect(this.deviceTransactionConfirm.or(this.hostSignModalContinueBtn)).toBeVisible();
        return;
      }

      if (step === 0 && (await this.signAmountContinueBtn.isVisible())) {
        await expect(this.signAmountContinueBtn).toBeEnabled();
        await this.signAmountContinueBtn.click();
        await expect(this.signSummaryContinueBtn.or(this.hostSignModalContinueBtn)).toBeVisible();
        continue;
      }

      await expect(this.hostSignModalContinueBtn).toBeVisible();
      await expect(this.hostSignModalContinueBtn).toBeEnabled();
      await this.hostSignModalContinueBtn.click();

      if (step === 0) {
        await expect(
          this.signSummaryContinueBtn
            .or(this.hostSignModalContinueBtn)
            .or(this.deviceTransactionConfirm),
        ).toBeVisible();
        continue;
      }
      return;
    }

    throw new Error("Host sign modal Continue button not found after fee/review steps");
  }

  @step("Wait for host device validation screen")
  async waitForHostDeviceValidation() {
    await expect(this.deviceTransactionConfirm).toBeVisible();
  }

  @step("Wait for host sign modal to close")
  async waitForHostSignModalClosed() {
    await expect(this.hostSignModal).toBeHidden({ timeout: 120_000 });
    await expect(this.modalBackdrop).toBeHidden({ timeout: 120_000 });
  }

  @step("Complete host device signature")
  async completeHostDeviceSignature(signOnDevice: () => Promise<void>) {
    await this.clickSignSummaryContinue();
    await Promise.all([this.waitForHostDeviceValidation(), signOnDevice()]);
    await this.waitForHostSignModalClosed();
  }

  @step("Click Try again on borrow execution error")
  async clickExecutionTryAgainIfVisible(): Promise<boolean> {
    const webview = await this.getWebView();
    const tryAgain = webview.getByRole("button", { name: "Try again" });
    if (!(await tryAgain.isVisible())) return false;
    await tryAgain.click();
    return true;
  }

  @step("Wait for Step 1 approval to complete")
  async expectApprovalStepCompleted() {
    const webview = await this.getWebView();
    await this.expectFlowComplete(
      webview,
      [webview.getByTestId(this.step1AccessApproved)],
      "Step 1 approval",
    );
    await expect(webview.getByTestId(this.authorizeDepositing)).toBeEnabled();
  }

  @step("Wait for Step 2 deposit to complete")
  async expectDepositStepCompleted() {
    const webview = await this.getWebView();
    await this.expectFlowComplete(
      webview,
      [webview.getByTestId(this.step2DepositDone)],
      "Step 2 deposit",
    );
    await expect(webview.getByTestId(this.authorizeBorrowing)).toBeEnabled();
  }

  @step("Wait for Step 3 borrow to complete")
  async expectBorrowStepCompleted() {
    const webview = await this.getWebView();
    await this.expectFlowComplete(
      webview,
      [
        webview.getByTestId(this.step3BorrowDone),
        webview.getByTestId(this.loanCompletionCard),
        webview.getByTestId(this.viewMyLoan),
      ],
      "Borrow Step 3",
    );
  }

  @step("Verify loan success screen")
  async expectLoanSuccess() {
    const webview = await this.getWebView();
    await this.expectAnyVisible(
      [
        webview.getByTestId(this.loanCompletionCard),
        webview.getByTestId(this.viewMyLoan),
        webview.getByTestId(this.yourLoansTitle),
        webview.getByTestId(this.getNewLoan),
      ],
      SCREEN_TIMEOUT_MS,
      "Loan success screen never appeared",
    );
  }

  @step("Click the active loan on the dashboard")
  async clickActiveLoanDashboardRow() {
    const webview = await this.getWebView();
    const rows = webview.getByTestId(this.loanDashboardRow);
    await expect(rows).toHaveCount(1, { timeout: SCREEN_TIMEOUT_MS });

    for (let attempt = 0; attempt < 4; attempt++) {
      await rows.first().click();
      try {
        await expect(webview).toHaveURL(this.loanOverviewRoutePattern, { timeout: 20_000 });
        await expect(webview.getByTestId(this.loanOverviewScreen)).toBeVisible();
        await expect(webview.getByTestId(this.repayButton)).toBeEnabled();
        return;
      } catch {
        await webview.reload();
        await expect(webview.getByTestId(this.loansDashboard)).toBeVisible({
          timeout: SCREEN_TIMEOUT_MS,
        });
        await expect(rows).toHaveCount(1);
      }
    }

    throw new Error("Loan dashboard row never navigated to the loan overview after 4 attempts");
  }

  @step("Click the repaid loan on the dashboard")
  async clickRepaidLoanDashboardRow() {
    const webview = await this.getWebView();
    const rows = webview.getByTestId(this.loanDashboardRow);
    await expect(rows).toHaveCount(1, { timeout: SCREEN_TIMEOUT_MS });
    await rows.first().click();
    await expect(webview).toHaveURL(this.withdrawOverviewRoutePattern);
    await expect(webview.getByTestId(this.withdrawOverviewScreen)).toBeVisible();
  }

  @step("Click Back to my loans")
  async clickBackToMyLoans() {
    const webview = await this.getWebView();
    await webview.getByTestId(this.backToMyLoans).click();
    await this.expectAnyVisible(
      [
        webview.getByTestId(this.loansDashboard),
        webview.getByTestId(this.getNewLoan),
        webview.getByTestId(this.introModal),
      ],
      SCREEN_TIMEOUT_MS,
      "Back to my loans never returned to the dashboard",
    );
  }

  @step("Click Repay on loan overview")
  async clickRepay() {
    const webview = await this.getWebView();
    await this.clickWhenEnabled(this.repayButton);
    await expect(webview.getByTestId(this.repayModal)).toBeVisible();
  }

  @step("Repay in full and continue to execution")
  async submitRepayInFull() {
    const webview = await this.getWebView();
    await this.clickWhenEnabled(this.repayInFull);

    const continueButton = webview.getByTestId(this.repayContinue);
    await expect(continueButton).toBeEnabled({ timeout: 30_000 });
    await continueButton.click();

    await expect(webview.getByTestId(this.repayModal)).toBeHidden();
    await expect(webview).toHaveURL(this.repayExecutionRoutePattern);
    await expect(webview.getByTestId(this.repayExecutionScreen)).toBeVisible();
  }

  @step("Wait for repay Step 1 approval to complete")
  async expectRepayApprovalStepCompleted() {
    const webview = await this.getWebView();
    await this.expectFlowComplete(
      webview,
      [webview.getByTestId(this.repayStep1AccessApproved)],
      "Repay Step 1 approval",
    );
    await expect(webview.getByTestId(this.authorizeRepay)).toBeEnabled();
  }

  @step("Wait for repay execution to complete")
  async expectRepayExecutionCompleted() {
    const webview = await this.getWebView();
    await this.expectFlowComplete(
      webview,
      [
        webview.getByTestId(this.repayStep2Done),
        webview.getByTestId(this.repayCompletionCard),
        webview.getByTestId(this.viewMyLoan),
      ],
      "Repay execution",
    );
  }

  @step("Verify repay success screen")
  async expectRepaySuccess() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.repayCompletionCard)).toBeVisible({
      timeout: SCREEN_TIMEOUT_MS,
    });
    await expect(webview.getByTestId(this.viewMyLoan)).toBeVisible();
  }

  @step("Click Withdraw collateral on overview")
  async clickWithdrawCollateral() {
    const webview = await this.getWebView();
    await this.clickWhenEnabled(this.withdrawCollateral);
    await expect(webview).toHaveURL(this.withdrawExecutionRoutePattern);
    await expect(webview.getByTestId(this.withdrawExecutionScreen)).toBeVisible();
  }

  @step("Wait for withdraw execution to complete")
  async expectWithdrawExecutionCompleted() {
    const webview = await this.getWebView();
    await this.expectFlowComplete(
      webview,
      [
        webview.getByTestId(this.withdrawStepDone),
        webview.getByTestId(this.withdrawCompletionCard),
        webview.getByTestId(this.backToMyLoans),
      ],
      "Withdraw execution",
    );
  }

  @step("Verify withdraw success screen")
  async expectWithdrawSuccess() {
    const webview = await this.getWebView();
    await expect(webview.getByTestId(this.withdrawCompletionCard)).toBeVisible({
      timeout: SCREEN_TIMEOUT_MS,
    });
    await expect(webview.getByTestId(this.backToMyLoans)).toBeVisible();
  }
}
