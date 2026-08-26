import { Step } from "jest-allure2-reporter/api";
import { WebElementHelpers } from "../../helpers/elementHelpers";
import { retryUntilTimeout } from "../../utils/retry";

const MODAL_DISMISS_TIMEOUT_MS = 30_000;
const CONTINUE_READY_TIMEOUT_MS = 30_000;
/** The partner prepares each transaction server-side, so the CTA stays disabled meanwhile. */
const EXECUTION_STEP_TIMEOUT_MS = 240_000;
const PROBE_TIMEOUT_MS = 2_000;

const MAINNET_FUNDING_HINT =
  "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

export default class BorrowPage {
  // ── Open-loan screens ────────────────────────────────────────────────────
  private readonly borrowScreenId = "borrow-screen";
  private readonly introModalId = "borrow-intro-modal";
  private readonly introModalTitleId = "borrow-intro-modal-title";
  private readonly simulateMyLoanButtonId = "borrow-simulate-my-loan-button";
  private readonly simulateLoanScreenId = "borrow-simulate-loan-screen";
  private readonly loanAmountInputId = "borrow-loan-amount-input";
  private readonly simulateContinueButtonId = "borrow-simulate-continue-button";
  private readonly loanExecutionScreenId = "borrow-loan-execution-screen";
  private readonly giveApprovalButtonId = "give-approval-button";
  private readonly authorizeDepositingButtonId = "borrow-authorize-depositing-button";
  private readonly authorizeBorrowingButtonId = "borrow-authorize-borrowing-button";
  private readonly step1AccessApprovedId = "borrow-step-1-access-approved";
  private readonly step2DepositDoneId = "borrow-step-2-deposit-done";
  private readonly loanCompletionCardId = "borrow-loan-completion-card";
  private readonly viewMyLoanButtonId = "borrow-view-my-loan-button";
  private readonly yourLoansTitleId = "borrow-your-loans-title";
  private readonly loansDashboardId = "borrow-loans-dashboard";
  private readonly loanDashboardRowId = "borrow-loan-dashboard-row";
  private readonly loanOverviewScreenId = "borrow-loan-overview-screen";

  // ── Repay screens ────────────────────────────────────────────────────────
  private readonly repayButtonId = "borrow-repay-button";
  private readonly repayModalId = "borrow-repay-modal";
  private readonly repayInFullButtonId = "borrow-repay-in-full-button";
  private readonly repayContinueButtonId = "borrow-repay-continue-button";
  private readonly repayExecutionScreenId = "borrow-repay-execution-screen";
  private readonly authorizeRepayButtonId = "borrow-authorize-repay-button";
  private readonly repayStep1ApprovedId = "borrow-repay-step-1-access-approved";
  private readonly repayStep2DoneId = "borrow-repay-step-2-repay-done";
  private readonly repayCompletionCardId = "borrow-repay-completion-card";

  // ── Withdraw screens ─────────────────────────────────────────────────────
  private readonly withdrawOverviewScreenId = "borrow-withdraw-overview-screen";
  private readonly withdrawCollateralButtonId = "borrow-withdraw-collateral-button";
  private readonly withdrawExecutionScreenId = "borrow-withdraw-execution-screen";
  private readonly authorizeWithdrawButtonId = "borrow-authorize-withdraw-button";
  private readonly withdrawStepDoneId = "borrow-withdraw-step-done";
  private readonly withdrawCompletionCardId = "borrow-withdraw-completion-card";
  private readonly backToMyLoansButtonId = "borrow-back-to-my-loans-button";

  // ── Shared ───────────────────────────────────────────────────────────────
  private readonly executionErrorLocator =
    '[data-testid="borrow-execution-error"], [data-testid="borrow-on-chain-failed-message"]';

  /** The collateral row carries no test id, so it is matched on its symbol. */
  private readonly symbolButtonXpath = (symbol: string) =>
    `//*[(self::button or @role='button') and normalize-space(.)='${symbol}']`;

  private readonly keypadDigitTestId = (digit: string) => `custom-keyboard-key-${digit}`;

  // ── Open-loan flow ───────────────────────────────────────────────────────

  @Step("Expect borrow native screen visible")
  async expectBorrowScreenVisible() {
    await waitForElementById(this.borrowScreenId);
    await waitForElementById(app.common.walletApiWebview, undefined, { checkVisibility: false });
    await waitForWebviewContentToRender();
  }

  @Step("Expect the Introducing Crypto Loan modal")
  async expectIntroModal() {
    await waitWebElementByTestId(this.introModalId);
    await waitWebElementByTestId(this.introModalTitleId);
  }

  @Step("Click Simulate my loan on the intro modal")
  async clickSimulateMyLoan() {
    await this.revealAndTap(this.simulateMyLoanButtonId);
    await retryUntilTimeout(
      () => expectWebElementNotVisible(this.introModalId),
      MODAL_DISMISS_TIMEOUT_MS,
    );
  }

  @Step("Expect the simulate-loan screen")
  async expectSimulateLoanScreen() {
    await waitForCurrentWebviewUrlToContain("/loan/simulate-loan");
    await waitWebElementByTestId(this.simulateLoanScreenId);
    await waitWebElementByTestId(this.loanAmountInputId);
  }

  /** The amount input is read-only; the value is driven by the keypad. */
  @Step("Type loan amount")
  async typeLoanAmount(amount: string) {
    await waitWebElementByTestId(this.simulateLoanScreenId);
    for (const digit of amount) {
      await this.revealAndTap(this.keypadDigitTestId(digit));
    }
    await waitForWebElementToBeEnabled(this.simulateContinueButtonId, CONTINUE_READY_TIMEOUT_MS);
  }

  @Step("Expect the required collateral")
  async expectCollateral(symbol: string) {
    await waitWebElement(getWebElementByXpath(this.symbolButtonXpath(symbol)));
  }

  /** The LTV row carries no test id, so it is read off the rendered simulate-loan text. */
  @Step("Expect the loan to value")
  async expectLoanToValue(percentage: string) {
    await waitWebElementByTestId(this.simulateLoanScreenId);
    const screenText = String(
      await WebElementHelpers.getWebElementByTag("body").runScript(
        (el: HTMLElement) => el.innerText,
      ),
    );
    if (!new RegExp(String.raw`Loan to Value[^\d]*${percentage}`).test(screenText)) {
      throw new Error(
        `Expected a loan to value of ${percentage} but the simulate-loan screen showed: ${screenText.replace(/\n+/g, " | ")}`,
      );
    }
  }

  @Step("Click Continue on the simulate-loan screen")
  async clickContinue() {
    await this.revealAndTap(this.simulateContinueButtonId, CONTINUE_READY_TIMEOUT_MS);
  }

  @Step("Expect the loan execution screen")
  async expectExecutionScreen() {
    await waitForCurrentWebviewUrlToContain("/loan/loan-execution");
    await waitWebElementByTestId(this.loanExecutionScreenId);
  }

  @Step("Give approval and sign on device")
  async completeApprovalStep() {
    await this.authorizeStep(this.giveApprovalButtonId, this.step1AccessApprovedId, () =>
      this.signContractTransaction(),
    );
  }

  @Step("Authorize depositing and sign on device")
  async authorizeDeposit() {
    await this.authorizeStep(this.authorizeDepositingButtonId, this.step2DepositDoneId, () =>
      this.signContractTransaction(),
    );
  }

  /** Completing the last step leaves the execution screen, so the terminal card is the marker. */
  @Step("Authorize borrowing and sign on device")
  async authorizeBorrow() {
    await this.authorizeStep(this.authorizeBorrowingButtonId, this.loanCompletionCardId, () =>
      this.signContractTransaction(),
    );
    await waitWebElementByTestId(this.viewMyLoanButtonId);
  }

  @Step("Click View my loan")
  async clickViewMyLoan() {
    await this.revealAndTap(this.viewMyLoanButtonId);
  }

  @Step("Expect loans dashboard visible")
  async expectLoansDashboard() {
    await waitWebElementByTestId(this.yourLoansTitleId);
    await waitWebElementByTestId(this.loansDashboardId);
  }

  @Step("Expect at least one loan row on the dashboard")
  async expectLoanDashboardRow() {
    await waitWebElementByTestId(this.loanDashboardRowId);
  }

  // ── Repay flow ───────────────────────────────────────────────────────────

  /**
   * Taps the active loan row and waits for the loan overview screen.
   * Retries with webview reload on navigation failure — the overview can be slow to render
   * on the first tap if the partner API index is still settling.
   */
  @Step("Tap the active loan row and wait for loan overview")
  async clickActiveLoanDashboardRow() {
    await waitWebElementByTestId(this.loanDashboardRowId);
    for (let attempt = 0; attempt < 4; attempt++) {
      await tapWebElementByTestId(this.loanDashboardRowId);
      try {
        await waitForCurrentWebviewUrlToContain("/loanoverview/");
        await waitWebElementByTestId(this.loanOverviewScreenId);
        await waitForWebElementToBeEnabled(this.repayButtonId);
        return;
      } catch {
        await waitWebElementByTestId(this.loansDashboardId);
        await waitWebElementByTestId(this.loanDashboardRowId);
      }
    }
    throw new Error("Loan dashboard row never navigated to the loan overview after 4 attempts");
  }

  @Step("Click Repay on loan overview")
  async clickRepay() {
    await this.revealAndTap(this.repayButtonId);
    await waitWebElementByTestId(this.repayModalId);
  }

  @Step("Select Repay in full and continue to execution")
  async submitRepayInFull() {
    await this.revealAndTap(this.repayInFullButtonId);
    await this.revealAndTap(this.repayContinueButtonId);
    await waitForCurrentWebviewUrlToContain("/forms/repay/");
    await waitWebElementByTestId(this.repayExecutionScreenId);
  }

  /**
   * The token approval step may or may not be required depending on whether the wallet
   * already approved the cToken. Checks for the Give approval button and completes it
   * if present; otherwise proceeds directly to the repay authorization.
   */
  @Step("Complete repay approval step if required")
  async completeRepayApprovalStepIfRequired() {
    await waitWebElementByTestId(this.repayExecutionScreenId);
    const approvalVisible = await waitWebElement(
      getWebElementByTestId(this.giveApprovalButtonId),
      PROBE_TIMEOUT_MS,
      false,
    );
    if (!approvalVisible) return;
    await this.authorizeStep(
      this.giveApprovalButtonId,
      this.repayStep1ApprovedId,
      () => this.signContractTransaction(),
      this.repayExecutionScreenId,
    );
  }

  @Step("Authorize repay and sign on device")
  async authorizeRepay() {
    await this.authorizeStep(
      this.authorizeRepayButtonId,
      this.repayStep2DoneId,
      () => this.signContractTransaction(),
      this.repayExecutionScreenId,
    );
  }

  @Step("Expect repay success")
  async expectRepaySuccess() {
    await waitWebElementByTestId(this.repayCompletionCardId);
    await waitWebElementByTestId(this.viewMyLoanButtonId);
  }

  // ── Withdraw flow ────────────────────────────────────────────────────────

  @Step("Tap the repaid loan row and wait for withdraw overview")
  async clickRepaidLoanDashboardRow() {
    await waitWebElementByTestId(this.loanDashboardRowId);
    await tapWebElementByTestId(this.loanDashboardRowId);
    await waitForCurrentWebviewUrlToContain("/withdrawoverview/");
    await waitWebElementByTestId(this.withdrawOverviewScreenId);
  }

  @Step("Click Withdraw collateral")
  async clickWithdrawCollateral() {
    await this.revealAndTap(this.withdrawCollateralButtonId);
    await waitForCurrentWebviewUrlToContain("/forms/withdraw/");
    await waitWebElementByTestId(this.withdrawExecutionScreenId);
  }

  @Step("Authorize withdraw and sign on device")
  async authorizeWithdraw() {
    await this.authorizeStep(
      this.authorizeWithdrawButtonId,
      this.withdrawStepDoneId,
      () => this.signContractTransaction(),
      this.withdrawExecutionScreenId,
    );
  }

  @Step("Expect withdraw success")
  async expectWithdrawSuccess() {
    await waitWebElementByTestId(this.withdrawCompletionCardId);
    await waitWebElementByTestId(this.backToMyLoansButtonId);
  }

  @Step("Click Back to my loans")
  async clickBackToMyLoans() {
    await this.revealAndTap(this.backToMyLoansButtonId);
    await waitWebElementByTestId(this.loansDashboardId);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Taps an authorize button, steps through the native sign modal, signs on device,
   * then waits for the step-done marker.
   *
   * @param screenId - testId of the execution screen; defaults to the open-loan screen.
   */
  private async authorizeStep(
    buttonId: string,
    doneId: string,
    sign: () => Promise<void>,
    screenId = this.loanExecutionScreenId,
  ) {
    await waitWebElementByTestId(screenId);
    await expectWebElementNotVisible(doneId);
    await this.revealAndTap(buttonId, EXECUTION_STEP_TIMEOUT_MS);
    await waitForElementById(app.send.summaryContinueEnabledButtonId);
    await app.send.summaryContinue();
    await sign();
    await this.expectStepDone(doneId);
  }

  private async signContractTransaction() {
    await app.speculos.acceptEnableTransactionCheck();
    await app.speculos.signEvmContractTransaction();
  }

  /** Scrolls the target into view before tapping, so a partly-offscreen CTA is never tapped. */
  private async revealAndTap(testId: string, timeout?: number) {
    await waitForWebElementToBeEnabled(testId, timeout);
    await scrollToWebElement(getWebElementByTestId(testId));
    await tapWebElementByTestId(testId);
  }

  private async expectStepDone(doneId: string) {
    await device.disableSynchronization();
    try {
      await waitWebElementByTestId(doneId, { timeout: EXECUTION_STEP_TIMEOUT_MS });
    } catch {
      const executionFailed = await this.isExecutionErrorVisible();
      throw new Error(
        executionFailed
          ? `Borrow execution failed before "${doneId}". ${MAINNET_FUNDING_HINT}`
          : `Borrow step "${doneId}" did not complete within ${EXECUTION_STEP_TIMEOUT_MS}ms. ${MAINNET_FUNDING_HINT}`,
      );
    } finally {
      await device.enableSynchronization();
    }
  }

  private async isExecutionErrorVisible(): Promise<boolean> {
    return !!(await waitWebElement(
      getWebElementByCssSelector(this.executionErrorLocator),
      PROBE_TIMEOUT_MS,
      false,
    ));
  }
}
