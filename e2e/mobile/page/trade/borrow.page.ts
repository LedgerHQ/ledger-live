import { Step } from "jest-allure2-reporter/api";
import { WebElement } from "detox/detox";
import { WebElementHelpers } from "@e2e/helpers/elementHelpers";
import { retryUntilTimeout } from "@e2e/utils/retry";

const MODAL_DISMISS_TIMEOUT_MS = 30_000;
const CONTINUE_READY_TIMEOUT_MS = 30_000;
/** The partner prepares each transaction server-side, so the CTA stays disabled meanwhile. */
const EXECUTION_STEP_TIMEOUT_MS = 240_000;
const SCREEN_READY_TIMEOUT_MS = 60_000;
const PROBE_TIMEOUT_MS = 2_000;
const EXECUTION_POLL_INTERVAL_MS = 2_000;

const MAINNET_FUNDING_HINT =
  "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
  private readonly getNewLoanButtonId = "borrow-get-new-loan-button";
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

  /** The execution-error retry carries no test id either. */
  private readonly tryAgainButtonXpath =
    "//*[(self::button or @role='button') and normalize-space(.)='Try again']";

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
   * Taps the active loan row and waits for the loan overview screen. Retries while the row is
   * still there — the overview can be slow to render if the partner API index is settling.
   */
  @Step("Tap the active loan row and wait for loan overview")
  async clickActiveLoanDashboardRow() {
    await waitWebElementByTestId(this.loanDashboardRowId);
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      await tapWebElementByTestId(this.loanDashboardRowId);
      try {
        await waitForCurrentWebviewUrlToContain("/loanoverview/");
        await waitWebElementByTestId(this.loanOverviewScreenId);
        await waitForWebElementToBeEnabled(this.repayButtonId);
        return;
      } catch (error) {
        lastError = error;
        if (!(await this.isPresent(getWebElementByTestId(this.loanDashboardRowId)))) break;
      }
    }
    throw new Error(
      `Loan overview never rendered after tapping the dashboard row: ${describeError(lastError)}`,
    );
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
    await this.authorizeStepWithRetry(
      this.authorizeRepayButtonId,
      [this.repayStep2DoneId, this.repayCompletionCardId, this.viewMyLoanButtonId],
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
    await this.authorizeStepWithRetry(
      this.authorizeWithdrawButtonId,
      [this.withdrawStepDoneId, this.withdrawCompletionCardId, this.backToMyLoansButtonId],
      () => this.signContractTransaction(),
      this.withdrawExecutionScreenId,
    );
  }

  @Step("Expect withdraw success")
  async expectWithdrawSuccess() {
    await waitWebElementByTestId(this.withdrawCompletionCardId);
    await waitWebElementByTestId(this.backToMyLoansButtonId);
  }

  /** Withdrawing the last loan empties the dashboard, so the no-loans screens count too. */
  @Step("Click Back to my loans")
  async clickBackToMyLoans() {
    await this.revealAndTap(this.backToMyLoansButtonId);
    await this.waitForAnyTestId(
      [this.loansDashboardId, this.getNewLoanButtonId, this.introModalId],
      SCREEN_READY_TIMEOUT_MS,
    );
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Taps an authorize button, steps through the native sign modal, signs on device,
   * then waits for the step to complete.
   *
   * @param doneIds - markers that mean the step completed; a terminal step leaves the
   * execution screen at once, so its completion card and CTA count as much as its marker.
   * @param screenId - testId of the execution screen; defaults to the open-loan screen.
   */
  private async authorizeStep(
    buttonId: string,
    doneIds: string | string[],
    sign: () => Promise<void>,
    screenId = this.loanExecutionScreenId,
  ) {
    const markers = Array.isArray(doneIds) ? doneIds : [doneIds];
    await waitWebElementByTestId(screenId);
    await expectWebElementNotVisible(markers[0]);
    await this.revealAndTap(buttonId, EXECUTION_STEP_TIMEOUT_MS);
    await waitForElementById(app.send.summaryContinueEnabledButtonId);
    await app.send.summaryContinue();
    await sign();
    await this.expectStepDone(markers);
  }

  /** The partner execution fails transiently on mainnet; the live app then offers Try again. */
  private async authorizeStepWithRetry(
    buttonId: string,
    doneIds: string[],
    sign: () => Promise<void>,
    screenId: string,
  ) {
    try {
      await this.authorizeStep(buttonId, doneIds, sign, screenId);
    } catch (error) {
      if (!(await this.clickExecutionTryAgainIfVisible())) throw error;
      await this.authorizeStep(buttonId, doneIds, sign, screenId);
    }
  }

  private async clickExecutionTryAgainIfVisible(): Promise<boolean> {
    const tryAgain = getWebElementByXpath(this.tryAgainButtonXpath);
    if (!(await waitWebElement(tryAgain, PROBE_TIMEOUT_MS, false))) return false;
    await tapWebElementByElement(tryAgain);
    return true;
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

  private async expectStepDone(doneIds: string[]) {
    await app.common.disableSynchronizationForiOS();
    try {
      if ((await this.awaitStepOutcome(doneIds)) === "error") {
        throw new Error(`Borrow execution failed before "${doneIds[0]}". ${MAINNET_FUNDING_HINT}`);
      }
    } finally {
      await app.common.enableSynchronization();
    }
  }

  /** Races the step markers against the error so a failed execution surfaces at once. */
  private async awaitStepOutcome(doneIds: string[]): Promise<"done" | "error"> {
    const deadline = Date.now() + EXECUTION_STEP_TIMEOUT_MS;
    while (Date.now() < deadline) {
      for (const doneId of doneIds) {
        if (await this.isPresent(getWebElementByTestId(doneId))) return "done";
      }
      if (await this.isPresent(getWebElementByCssSelector(this.executionErrorLocator))) {
        return "error";
      }
      await new Promise(resolve => setTimeout(resolve, EXECUTION_POLL_INTERVAL_MS));
    }
    throw new Error(
      `Borrow step "${doneIds.join('" / "')}" did not complete within ${EXECUTION_STEP_TIMEOUT_MS}ms. ${MAINNET_FUNDING_HINT}`,
    );
  }

  /** Resolves on the first marker to appear, for steps that can land on more than one screen. */
  private async waitForAnyTestId(ids: string[], timeout: number) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      for (const id of ids) {
        if (await this.isPresent(getWebElementByTestId(id))) return;
      }
      await new Promise(resolve => setTimeout(resolve, EXECUTION_POLL_INTERVAL_MS));
    }
    throw new Error(`None of "${ids.join('" / "')}" appeared within ${timeout}ms`);
  }

  /** Single shot, so polling a step that is still executing does not fill the log. */
  private async isPresent(element: WebElement): Promise<boolean> {
    try {
      await element.runScript(el => el.innerText);
      return true;
    } catch {
      return false;
    }
  }
}
