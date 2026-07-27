import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";

export class BorrowPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "borrow";

  // --- Routes ---
  private readonly borrowRoutePattern = /\/borrow/;
  private readonly simulateLoanRoutePattern = /\/loan\/simulate-loan/;
  private readonly loanExecutionRoutePattern = /\/loan\/loan-execution/;

  // --- Borrow webview test ids (mirror borrow-live-app/packages/features/src/testIds.ts) ---
  private readonly introModalId = "borrow-intro-modal";
  private readonly introModalTitleId = "borrow-intro-modal-title";
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

  private readonly hostContinueLabel = "Continue";
  private readonly hostSignModalTextPattern = /Approve token|Sign transaction/i;
  private readonly mainnetFundingHint =
    "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

  /** Partner polls mainnet after each signed tx; deposit step ETA is ~2 min. */
  private readonly executionStepTimeoutMs = 240_000;

  // --- Host (LLD) locators ---
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
    name: this.hostContinueLabel,
  });

  // --- Borrow webview locators (scoped to the live-app window) ---
  private introModal(webview: Page) {
    return webview.getByTestId(this.introModalId);
  }

  private introModalTitle(webview: Page) {
    return webview.getByTestId(this.introModalTitleId);
  }

  private simulateMyLoanBtn(webview: Page) {
    return webview.getByTestId(this.simulateMyLoanButtonId);
  }

  private simulateLoanScreen(webview: Page) {
    return webview.getByTestId(this.simulateLoanScreenId);
  }

  private loanAmountInput(webview: Page) {
    return webview.getByTestId(this.loanAmountInputId);
  }

  private simulateContinueBtn(webview: Page) {
    return webview.getByTestId(this.simulateContinueButtonId);
  }

  private getNewLoanBtn(webview: Page) {
    return webview.getByTestId(this.getNewLoanButtonId);
  }

  private loanExecutionScreen(webview: Page) {
    return webview.getByTestId(this.loanExecutionScreenId);
  }

  private giveApprovalBtn(webview: Page) {
    return webview.getByTestId(this.giveApprovalButtonId);
  }

  private authorizeDepositingBtn(webview: Page) {
    return webview.getByTestId(this.authorizeDepositingButtonId);
  }

  private authorizeBorrowingBtn(webview: Page) {
    return webview.getByTestId(this.authorizeBorrowingButtonId);
  }

  private executionFlowEntryBtn(webview: Page) {
    return this.giveApprovalBtn(webview).or(this.authorizeDepositingBtn(webview));
  }

  private executionErrorDialog(webview: Page) {
    return webview.getByTestId(this.executionErrorId);
  }

  private onChainFailedMessage(webview: Page) {
    return webview.getByTestId(this.onChainFailedMessageId);
  }

  private executionError(webview: Page) {
    return this.executionErrorDialog(webview).or(this.onChainFailedMessage(webview));
  }

  private async isExecutionErrorVisible(webview: Page): Promise<boolean> {
    return (
      (await this.executionErrorDialog(webview).isVisible()) ||
      (await this.onChainFailedMessage(webview).isVisible())
    );
  }

  private executionStepDone(webview: Page, doneTestId: string) {
    return webview.getByTestId(doneTestId);
  }

  private loanCompletionCard(webview: Page) {
    return webview.getByTestId(this.loanCompletionCardId);
  }

  private viewMyLoanBtn(webview: Page) {
    return webview.getByTestId(this.viewMyLoanButtonId);
  }

  private yourLoansHeading(webview: Page) {
    return webview.getByTestId(this.yourLoansTitleId);
  }

  private loanSuccessIndicator(webview: Page) {
    return this.loanCompletionCard(webview)
      .or(this.viewMyLoanBtn(webview))
      .or(this.yourLoansHeading(webview))
      .or(this.getNewLoanBtn(webview));
  }

  private borrowStepCompleteIndicator(webview: Page) {
    return webview
      .getByTestId(this.step3BorrowDoneId)
      .or(this.loanCompletionCard(webview))
      .or(this.viewMyLoanBtn(webview))
      .or(this.executionError(webview));
  }

  @step("Go and wait for Borrow cold-start entry")
  async goAndWaitForBorrowColdStart(entryFn: () => Promise<void>) {
    this._webviewPage = undefined;
    await entryFn();
    await expect(this.page).toHaveURL(this.borrowRoutePattern);
    await this.getWebView();
  }

  @step("Go and wait for Borrow app simulate-loan screen")
  async goAndWaitForBorrowToBeReady(entryFn: () => Promise<void>) {
    this._webviewPage = undefined;
    await entryFn();
    await expect(this.page).toHaveURL(this.borrowRoutePattern);
    const webview = await this.getWebView();
    await this.ensureSimulateLoanScreen(webview);
  }

  private async ensureSimulateLoanScreen(webview: Page) {
    if (this.simulateLoanRoutePattern.test(webview.url())) {
      await expect(this.simulateLoanScreen(webview)).toBeVisible();
      return;
    }

    const introModal = this.introModal(webview);
    const getNewLoanButton = this.getNewLoanBtn(webview);
    await expect(introModal.or(getNewLoanButton)).toBeVisible({ timeout: 60_000 });

    if (await introModal.isVisible()) {
      await this.clickSimulateMyLoan();
      return;
    }

    await getNewLoanButton.click();
    await expect(webview).toHaveURL(this.simulateLoanRoutePattern);
    await expect(this.simulateLoanScreen(webview)).toBeVisible();
  }

  @step("Dismiss intro modal if shown and wait for simulate screen")
  async dismissIntroModalIfVisible() {
    const webview = await this.getWebView();
    if (await this.introModal(webview).isVisible()) {
      await this.clickSimulateMyLoan();
      return;
    }
    await expect(this.loanAmountInput(webview)).toBeVisible();
  }

  @step("Verify Introducing Crypto Loan modal is visible")
  async verifyIntroModalVisible() {
    const webview = await this.getWebView();
    await expect(this.introModal(webview)).toBeVisible();
    await expect(this.introModalTitle(webview)).toBeVisible();
  }

  @step("Click Simulate my loan")
  async clickSimulateMyLoan() {
    const webview = await this.getWebView();
    const introModal = this.introModal(webview);
    await this.simulateMyLoanBtn(webview).click();
    await expect(introModal).toBeHidden();
    await expect(this.loanAmountInput(webview)).toBeVisible();
  }

  @step("Type loan amount")
  async typeLoanAmount(digits: string) {
    const webview = await this.getWebView();
    const amountInput = this.loanAmountInput(webview);
    await expect(amountInput).toBeVisible();
    await amountInput.click();
    await amountInput.fill(digits);
  }

  @step("Click Continue")
  async clickContinue() {
    const webview = await this.getWebView();
    const continueButton = this.simulateContinueBtn(webview);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  @step("Verify loan execution flow is visible")
  async expectExecutionFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(this.loanExecutionRoutePattern);
    await expect(this.loanExecutionScreen(webview)).toBeVisible();
    await expect(this.executionFlowEntryBtn(webview)).toBeVisible();
  }

  @step("Check if Give approval step is required")
  async isGiveApprovalRequired() {
    const webview = await this.getWebView();
    const giveApproval = this.giveApprovalBtn(webview);
    const authorizeDepositing = this.authorizeDepositingBtn(webview);
    await expect(giveApproval.or(authorizeDepositing)).toBeVisible({ timeout: 60_000 });
    return giveApproval.isVisible();
  }

  @step("Click Give approval")
  async clickGiveApproval() {
    const webview = await this.getWebView();
    await this.giveApprovalBtn(webview).click();
  }

  /**
   * Swap uses #sign-summary-continue-button; borrow host modal often only exposes role-based
   * Continue.
   */
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

  private async expectExecutionStepOutcome(webview: Page, doneTestId: string, stepLabel: string) {
    const done = this.executionStepDone(webview, doneTestId);
    const error = this.executionError(webview);

    await expect(done.or(error)).toBeVisible({ timeout: this.executionStepTimeoutMs });

    if (await this.isExecutionErrorVisible(webview)) {
      throw new Error(
        `Borrow execution step failed in webview (${stepLabel}, ${doneTestId}). ${this.mainnetFundingHint}`,
      );
    }
  }

  @step("Wait for Step 1 approval to complete")
  async expectApprovalStepCompleted() {
    const webview = await this.getWebView();
    await this.expectExecutionStepOutcome(webview, this.step1AccessApprovedId, "Step 1 approval");
    await expect(this.authorizeDepositingBtn(webview)).toBeEnabled();
  }

  @step("Wait for Step 2 deposit to complete")
  async expectDepositStepCompleted() {
    const webview = await this.getWebView();
    await this.expectExecutionStepOutcome(webview, this.step2DepositDoneId, "Step 2 deposit");
    await expect(this.authorizeBorrowingBtn(webview)).toBeEnabled();
  }

  @step("Wait for Step 3 borrow to complete")
  async expectBorrowStepCompleted() {
    const webview = await this.getWebView();
    await expect(this.borrowStepCompleteIndicator(webview).first()).toBeVisible({
      timeout: this.executionStepTimeoutMs,
    });

    if (await this.isExecutionErrorVisible(webview)) {
      throw new Error(`Borrow Step 3 failed in webview. ${this.mainnetFundingHint}`);
    }
  }

  @step("Click Authorize depositing")
  async clickAuthorizeDepositing() {
    const webview = await this.getWebView();
    const authorizeButton = this.authorizeDepositingBtn(webview);
    await expect(authorizeButton).toBeEnabled();
    await authorizeButton.click();
  }

  @step("Click Authorize borrowing")
  async clickAuthorizeBorrowing() {
    const webview = await this.getWebView();
    const authorizeButton = this.authorizeBorrowingBtn(webview);
    await expect(authorizeButton).toBeEnabled();
    await authorizeButton.click();
  }

  @step("Verify loan success screen")
  async expectLoanSuccess() {
    const webview = await this.getWebView();
    await expect(this.loanSuccessIndicator(webview).first()).toBeVisible({
      timeout: 60_000,
    });
  }
}
