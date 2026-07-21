import { expect, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";

export class BorrowPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "borrow";

  private readonly borrowRoutePattern = /\/borrow/;
  private readonly simulateLoanRoutePattern = /\/loan\/simulate-loan/;
  private readonly loanExecutionRoutePattern = /\/loan\/loan-execution/;
  private readonly introModalTitle = "Introducing Crypto Loan";
  private readonly simulateMyLoanButton = "Simulate my loan";
  private readonly enterLoanAmountLabel = "Enter loan amount";
  private readonly continueButton = "Continue";
  private readonly giveApprovalButton = "Give approval";
  private readonly authorizeDepositingButton = "Authorize depositing";
  private readonly authorizeBorrowingButton = "Authorize borrowing";
  private readonly accessApprovedSummary = "Step 1: Access approved";
  private readonly depositStepDoneSummary = "Step 2: Authorize depositing collateral";
  private readonly borrowStepDoneSummary = "Loan received successfully";
  private readonly loanCompletionPattern = /Congrats! Your (USDC|USDT) loan is on the way\./;
  private readonly viewMyLoanButton = "View my loan";
  private readonly getNewLoanButton = "Get a new loan";
  private readonly yourLoansTitle = "Your loans";
  private readonly executionErrorTitle = "Something went wrong";
  private readonly onChainFailedMessage = "The transaction failed on-chain";
  /** Partner polls mainnet after each signed tx; deposit step ETA is ~2 min. */
  private readonly executionStepTimeoutMs = 240_000;
  private readonly signAmountContinueBtn = this.page.locator(
    "#sign-transaction-amount-continue-button",
  );
  private readonly signSummaryContinueBtn = this.page.locator("#sign-summary-continue-button");
  private readonly deviceTransactionConfirm = this.page.getByTestId(
    "device-action-transaction-confirm",
  );

  private introModal(webview: Page) {
    return webview.getByRole("dialog").filter({
      has: webview.getByRole("heading", { name: this.introModalTitle }),
    });
  }

  private introModalHeading(webview: Page) {
    return this.introModal(webview).getByRole("heading", { name: this.introModalTitle });
  }

  private hostSignModal() {
    return this.page.getByTestId("modal-container").filter({
      has: this.page.getByText(/Approve token|Sign transaction/i),
    });
  }

  private hostSignModalContinueButton() {
    return this.hostSignModal().getByRole("button", { name: this.continueButton });
  }

  /** Visible host sign modal overlay (opacity/scale + sign-step copy). */
  private visibleHostSignModal() {
    return this.page
      .locator('[data-testid=modal-container][style*="opacity: 1"][style*="transform: scale(1)"]')
      .filter({
        has: this.page.getByText(/Approve token|Sign transaction/i),
      });
  }

  private loanAmountInput(webview: Page) {
    return webview
      .getByText(this.enterLoanAmountLabel, { exact: true })
      .locator("..")
      .getByRole("textbox", { disabled: false });
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

    const getNewLoanButton = webview.getByRole("button", { name: this.getNewLoanButton });
    await expect(getNewLoanButton).toBeVisible({ timeout: 60_000 });
    await getNewLoanButton.click();
    await expect(webview).toHaveURL(this.simulateLoanRoutePattern);
  }

  @step("Dismiss intro modal if shown and wait for simulate screen")
  async dismissIntroModalIfVisible() {
    const webview = await this.getWebView();
    const introModal = this.introModal(webview);
    if (await introModal.isVisible()) {
      await expect(this.introModalHeading(webview)).toBeVisible();
      await introModal.getByRole("button", { name: this.simulateMyLoanButton }).click();
      await expect(introModal).toBeHidden();
    }
    await expect(webview.getByText(this.enterLoanAmountLabel, { exact: true })).toBeVisible();
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
    await introModal.getByRole("button", { name: this.simulateMyLoanButton }).click();
    await expect(introModal).toBeHidden();
    await expect(webview.getByText(this.enterLoanAmountLabel, { exact: true })).toBeVisible();
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
    const continueButton = webview.getByRole("button", { name: this.continueButton });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  @step("Verify loan execution flow is visible")
  async expectExecutionFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(this.loanExecutionRoutePattern);
    await expect(
      webview
        .getByRole("button", { name: this.giveApprovalButton })
        .or(webview.getByRole("button", { name: this.authorizeDepositingButton })),
    ).toBeVisible();
  }

  @step("Check if Give approval step is required")
  async isGiveApprovalRequired() {
    const webview = await this.getWebView();
    const giveApproval = webview.getByRole("button", { name: this.giveApprovalButton });
    const authorizeDepositing = webview.getByRole("button", {
      name: this.authorizeDepositingButton,
    });
    await expect(giveApproval.or(authorizeDepositing)).toBeVisible({ timeout: 60_000 });
    return giveApproval.isVisible();
  }

  @step("Click Give approval")
  async clickGiveApproval() {
    const webview = await this.getWebView();
    await webview.getByRole("button", { name: this.giveApprovalButton }).click();
  }

  /** Swap uses #sign-summary-continue-button; borrow host modal often only exposes role-based Continue. */
  @step("Click Continue on host sign modal")
  async clickSignSummaryContinue() {
    await expect(this.hostSignModal()).toBeVisible();

    for (let step = 0; step < 2; step++) {
      if (await this.signSummaryContinueBtn.isVisible()) {
        await expect(this.signSummaryContinueBtn).toBeEnabled();
        await this.signSummaryContinueBtn.click();
        return;
      }

      if (step === 0 && (await this.signAmountContinueBtn.isVisible())) {
        await expect(this.signAmountContinueBtn).toBeEnabled();
        await this.signAmountContinueBtn.click();
        await expect(
          this.signSummaryContinueBtn.or(this.hostSignModalContinueButton()),
        ).toBeVisible();
        continue;
      }

      const modalContinue = this.hostSignModalContinueButton();
      await expect(modalContinue).toBeVisible();
      await expect(modalContinue).toBeEnabled();
      await modalContinue.click();

      if (step === 0) {
        await expect(
          this.signSummaryContinueBtn
            .or(this.hostSignModalContinueButton())
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
    await expect(this.visibleHostSignModal()).toBeHidden({ timeout: 120_000 });
  }

  private async expectExecutionStepOutcome(webview: Page, doneSummary: string) {
    const done = webview.getByText(doneSummary, { exact: true });
    const error = webview
      .getByText(this.executionErrorTitle, { exact: true })
      .or(webview.getByText(this.onChainFailedMessage));

    await expect(done.or(error)).toBeVisible({ timeout: this.executionStepTimeoutMs });

    if (await error.isVisible()) {
      throw new Error(
        `Borrow execution step failed in webview (${doneSummary}). ` +
          "Ensure ETH_4 (index 3) holds enough wBTC collateral and ETH for mainnet gas.",
      );
    }
  }

  @step("Wait for Step 1 approval to complete")
  async expectApprovalStepCompleted() {
    const webview = await this.getWebView();
    await this.expectExecutionStepOutcome(webview, this.accessApprovedSummary);
    await expect(
      webview.getByRole("button", { name: this.authorizeDepositingButton }),
    ).toBeEnabled();
  }

  @step("Wait for Step 2 deposit to complete")
  async expectDepositStepCompleted() {
    const webview = await this.getWebView();
    await this.expectExecutionStepOutcome(webview, this.depositStepDoneSummary);
    await expect(
      webview.getByRole("button", { name: this.authorizeBorrowingButton }),
    ).toBeEnabled();
  }

  @step("Wait for Step 3 borrow to complete")
  async expectBorrowStepCompleted() {
    const webview = await this.getWebView();
    const stepDone = webview.getByText(this.borrowStepDoneSummary, { exact: true });
    const completionCard = webview.getByText(this.loanCompletionPattern);
    const viewLoan = webview.getByRole("button", { name: this.viewMyLoanButton });
    const error = webview
      .getByText(this.executionErrorTitle, { exact: true })
      .or(webview.getByText(this.onChainFailedMessage));

    await expect(stepDone.or(completionCard).or(viewLoan).or(error)).toBeVisible({
      timeout: this.executionStepTimeoutMs,
    });

    if (await error.isVisible()) {
      throw new Error(
        "Borrow Step 3 failed in webview. Ensure ETH_4 holds enough collateral and ETH for mainnet gas.",
      );
    }
  }

  @step("Click Authorize depositing")
  async clickAuthorizeDepositing() {
    const webview = await this.getWebView();
    const authorizeButton = webview.getByRole("button", { name: this.authorizeDepositingButton });
    await expect(authorizeButton).toBeEnabled();
    await authorizeButton.click();
  }

  @step("Click Authorize borrowing")
  async clickAuthorizeBorrowing() {
    const webview = await this.getWebView();
    const authorizeButton = webview.getByRole("button", { name: this.authorizeBorrowingButton });
    await expect(authorizeButton).toBeEnabled();
    await authorizeButton.click();
  }

  @step("Verify loan success screen")
  async expectLoanSuccess() {
    const webview = await this.getWebView();
    const completionCard = webview.getByText(this.loanCompletionPattern);
    const viewLoan = webview.getByRole("button", { name: this.viewMyLoanButton });
    const loansDashboard = webview.getByText(this.yourLoansTitle, { exact: true });
    const getNewLoan = webview.getByRole("button", { name: this.getNewLoanButton });

    await expect(completionCard.or(viewLoan).or(loansDashboard).or(getNewLoan)).toBeVisible({
      timeout: 60_000,
    });
  }
}
