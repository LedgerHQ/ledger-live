import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";

export class BorrowPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "borrow";

  // --- Routes ---
  private readonly borrowRoutePattern = /\/borrow/;
  private readonly simulateLoanRoutePattern = /\/loan\/simulate-loan/;
  private readonly loanExecutionRoutePattern = /\/loan\/loan-execution/;

  // --- Copy / labels (role+name until borrow-live-app exposes data-testids) ---
  private readonly introModalTitle = "Introducing Crypto Loan";
  private readonly simulateMyLoanLabel = "Simulate my loan";
  private readonly enterLoanAmountLabel = "Enter loan amount";
  private readonly continueLabel = "Continue";
  private readonly giveApprovalLabel = "Give approval";
  private readonly authorizeDepositingLabel = "Authorize depositing";
  private readonly authorizeBorrowingLabel = "Authorize borrowing";
  private readonly accessApprovedSummary = "Step 1: Access approved";
  private readonly depositStepDoneSummary = "Step 2: Authorize depositing collateral";
  private readonly borrowStepDoneSummary = "Loan received successfully";
  private readonly loanCompletionPattern = /Congrats! Your (USDC|USDT) loan is on the way\./;
  private readonly viewMyLoanLabel = "View my loan";
  private readonly getNewLoanLabel = "Get a new loan";
  private readonly yourLoansTitle = "Your loans";
  private readonly executionErrorTitle = "Something went wrong";
  private readonly onChainFailedMessage = "The transaction failed on-chain";
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
    name: this.continueLabel,
  });

  // --- Borrow webview locators (scoped to the live-app window) ---
  private introModal(webview: Page) {
    return webview.getByRole("dialog").filter({
      has: webview.getByRole("heading", { name: this.introModalTitle }),
    });
  }

  private introModalHeading(webview: Page) {
    return this.introModal(webview).getByRole("heading", { name: this.introModalTitle });
  }

  private simulateMyLoanBtn(webview: Page) {
    return this.introModal(webview).getByRole("button", { name: this.simulateMyLoanLabel });
  }

  private enterLoanAmountHeading(webview: Page) {
    return webview.getByText(this.enterLoanAmountLabel, { exact: true });
  }

  private loanAmountInput(webview: Page) {
    return this.enterLoanAmountHeading(webview)
      .locator("..")
      .getByRole("textbox", { disabled: false });
  }

  private continueBtn(webview: Page) {
    return webview.getByRole("button", { name: this.continueLabel });
  }

  private getNewLoanBtn(webview: Page) {
    return webview.getByRole("button", { name: this.getNewLoanLabel });
  }

  private giveApprovalBtn(webview: Page) {
    return webview.getByRole("button", { name: this.giveApprovalLabel });
  }

  private authorizeDepositingBtn(webview: Page) {
    return webview.getByRole("button", { name: this.authorizeDepositingLabel });
  }

  private authorizeBorrowingBtn(webview: Page) {
    return webview.getByRole("button", { name: this.authorizeBorrowingLabel });
  }

  private executionFlowEntryBtn(webview: Page) {
    return this.giveApprovalBtn(webview).or(this.authorizeDepositingBtn(webview));
  }

  private executionError(webview: Page) {
    return webview
      .getByText(this.executionErrorTitle, { exact: true })
      .or(webview.getByText(this.onChainFailedMessage));
  }

  private executionStepDone(webview: Page, doneSummary: string) {
    return webview.getByText(doneSummary, { exact: true });
  }

  private borrowStepDoneText(webview: Page) {
    return webview.getByText(this.borrowStepDoneSummary, { exact: true });
  }

  private loanCompletionCard(webview: Page) {
    return webview.getByText(this.loanCompletionPattern);
  }

  private viewMyLoanBtn(webview: Page) {
    return webview.getByRole("button", { name: this.viewMyLoanLabel });
  }

  private yourLoansHeading(webview: Page) {
    return webview.getByText(this.yourLoansTitle, { exact: true });
  }

  private loanSuccessIndicator(webview: Page) {
    return this.loanCompletionCard(webview)
      .or(this.viewMyLoanBtn(webview))
      .or(this.yourLoansHeading(webview))
      .or(this.getNewLoanBtn(webview));
  }

  private borrowStepCompleteIndicator(webview: Page) {
    return this.borrowStepDoneText(webview)
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
  }

  @step("Dismiss intro modal if shown and wait for simulate screen")
  async dismissIntroModalIfVisible() {
    const webview = await this.getWebView();
    if (await this.introModal(webview).isVisible()) {
      await this.clickSimulateMyLoan();
      return;
    }
    await expect(this.enterLoanAmountHeading(webview)).toBeVisible();
  }

  @step("Verify Introducing Crypto Loan modal is visible")
  async verifyIntroModalVisible() {
    const webview = await this.getWebView();
    await expect(this.introModal(webview)).toBeVisible();
    await expect(this.introModalHeading(webview)).toBeVisible();
  }

  @step("Click Simulate my loan")
  async clickSimulateMyLoan() {
    const webview = await this.getWebView();
    const introModal = this.introModal(webview);
    await this.simulateMyLoanBtn(webview).click();
    await expect(introModal).toBeHidden();
    await expect(this.enterLoanAmountHeading(webview)).toBeVisible();
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
    const continueButton = this.continueBtn(webview);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  @step("Verify loan execution flow is visible")
  async expectExecutionFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(this.loanExecutionRoutePattern);
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

  private async expectExecutionStepOutcome(webview: Page, doneSummary: string) {
    const done = this.executionStepDone(webview, doneSummary);
    const error = this.executionError(webview);

    await expect(done.or(error)).toBeVisible({ timeout: this.executionStepTimeoutMs });

    if (await error.isVisible()) {
      throw new Error(
        `Borrow execution step failed in webview (${doneSummary}). ${this.mainnetFundingHint}`,
      );
    }
  }

  @step("Wait for Step 1 approval to complete")
  async expectApprovalStepCompleted() {
    const webview = await this.getWebView();
    await this.expectExecutionStepOutcome(webview, this.accessApprovedSummary);
    await expect(this.authorizeDepositingBtn(webview)).toBeEnabled();
  }

  @step("Wait for Step 2 deposit to complete")
  async expectDepositStepCompleted() {
    const webview = await this.getWebView();
    await this.expectExecutionStepOutcome(webview, this.depositStepDoneSummary);
    await expect(this.authorizeBorrowingBtn(webview)).toBeEnabled();
  }

  @step("Wait for Step 3 borrow to complete")
  async expectBorrowStepCompleted() {
    const webview = await this.getWebView();
    // Success screen can show several indicators at once; .first() avoids Playwright strict mode.
    await expect(this.borrowStepCompleteIndicator(webview).first()).toBeVisible({
      timeout: this.executionStepTimeoutMs,
    });

    if (await this.executionError(webview).isVisible()) {
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
