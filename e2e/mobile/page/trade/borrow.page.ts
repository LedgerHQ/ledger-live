import { Step } from "jest-allure2-reporter/api";
import { WebElement } from "detox/detox";
import { sleep } from "@ledgerhq/live-e2e-shared/index";
import { WebElementHelpers } from "@e2e/helpers/elementHelpers";
import { retryUntilTimeout } from "@e2e/utils/retry";

const MODAL_DISMISS_TIMEOUT_MS = 30_000;
const CONTINUE_READY_TIMEOUT_MS = 30_000;
const EXECUTION_STEP_TIMEOUT_MS = 240_000;
const SCREEN_READY_TIMEOUT_MS = 60_000;
const DASHBOARD_READY_TIMEOUT_MS = 120_000;
const EXECUTION_POLL_INTERVAL_MS = 2_000;

const MAINNET_FUNDING_HINT =
  "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

export default class BorrowPage {
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
  private readonly step3BorrowDoneId = "borrow-step-3-borrow-done";
  private readonly loanCompletionCardId = "borrow-loan-completion-card";
  private readonly viewMyLoanButtonId = "borrow-view-my-loan-button";
  private readonly getNewLoanButtonId = "borrow-get-new-loan-button";
  private readonly yourLoansTitleId = "borrow-your-loans-title";
  private readonly loansDashboardId = "borrow-loans-dashboard";
  private readonly loanDashboardRowId = "borrow-loan-dashboard-row";

  private readonly repayButtonId = "borrow-repay-button";
  private readonly repayModalId = "borrow-repay-modal";
  private readonly repayInFullButtonId = "borrow-repay-in-full-button";
  private readonly repayContinueButtonId = "borrow-repay-continue-button";
  private readonly repayExecutionScreenId = "borrow-repay-execution-screen";
  private readonly authorizeRepayButtonId = "borrow-authorize-repay-button";
  private readonly repayStep1ApprovedId = "borrow-repay-step-1-access-approved";
  private readonly repayStep2DoneId = "borrow-repay-step-2-repay-done";
  private readonly repayCompletionCardId = "borrow-repay-completion-card";

  private readonly withdrawOverviewScreenId = "borrow-withdraw-overview-screen";
  private readonly withdrawCollateralButtonId = "borrow-withdraw-collateral-button";
  private readonly withdrawExecutionScreenId = "borrow-withdraw-execution-screen";
  private readonly authorizeWithdrawButtonId = "borrow-authorize-withdraw-button";
  private readonly withdrawStepDoneId = "borrow-withdraw-step-done";
  private readonly withdrawCompletionCardId = "borrow-withdraw-completion-card";
  private readonly backToMyLoansButtonId = "borrow-back-to-my-loans-button";

  private readonly executionErrorLocator =
    '[data-testid="borrow-execution-error"], [data-testid="borrow-on-chain-failed-message"]';

  /** The collateral row carries no test id, so it is matched on its symbol. */
  private readonly symbolButtonXpath = (symbol: string) =>
    `//*[(self::button or @role='button') and normalize-space(.)='${symbol}']`;

  private readonly keypadDigitTestId = (digit: string) => `custom-keyboard-key-${digit}`;

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

  @Step("Expect the Morpho authorization to already be granted")
  async expectAccessAlreadyApproved() {
    const marker = await waitWebElementByTestId(this.step1AccessApprovedId, {
      throwOnTimeout: false,
    });
    if (!marker) {
      throw new Error(
        `"${this.step1AccessApprovedId}" is absent, so this account has not authorized Morpho ` +
          `yet and the flow opens on that step instead of the collateral approval. Grant it once ` +
          `by running the open-loan flow by hand — it is sticky on-chain state, not per-loan.`,
      );
    }
  }

  @Step("Authorize depositing and sign on device")
  async authorizeDeposit() {
    await this.authorizeStep(this.authorizeDepositingButtonId, this.step2DepositDoneId, () =>
      this.signContractTransaction(),
    );
  }

  /** Completing the last step leaves the execution screen, so the terminal card counts too. */
  @Step("Authorize borrowing and sign on device")
  async authorizeBorrow() {
    await this.authorizeStep(
      this.authorizeBorrowingButtonId,
      [this.step3BorrowDoneId, this.loanCompletionCardId, this.viewMyLoanButtonId],
      () => this.signContractTransaction(),
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

  /** With a loan already open the live app skips the introduction and lists the position. */
  @Step("Expect the borrow app to open on the loans dashboard")
  async expectHotStartDashboard() {
    await waitWebElementByTestId(this.loansDashboardId, { timeout: DASHBOARD_READY_TIMEOUT_MS });
    await waitWebElementByTestId(this.yourLoansTitleId);
    await waitWebElementByTestId(this.loanDashboardRowId);
  }

  /** Anchored on the Repay CTA: `borrow-loan-overview-screen` is web-only in the live app. */
  @Step("Open the loan with debt from the dashboard")
  async openActiveLoan() {
    await this.revealAndTap(this.loanDashboardRowId);
    await waitForCurrentWebviewUrlToContain("/loanoverview/");
    await waitForWebElementToBeEnabled(this.repayButtonId, SCREEN_READY_TIMEOUT_MS);
  }

  @Step("Click Repay on the loan overview")
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

  /** The spec zeroes the debt-token allowance beforehand, so this step is always required. */
  @Step("Give repay approval and sign on device")
  async completeRepayApprovalStep() {
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
      [this.repayStep2DoneId, this.repayCompletionCardId, this.viewMyLoanButtonId],
      () => this.signContractTransaction(),
      this.repayExecutionScreenId,
    );
  }

  @Step("Expect the repay completion card")
  async expectRepaySuccess() {
    await waitWebElementByTestId(this.repayCompletionCardId);
    await waitWebElementByTestId(this.viewMyLoanButtonId);
  }

  /** A loan with no debt left routes straight to withdraw instead of the loan overview. */
  @Step("Open the repaid loan from the dashboard")
  async openRepaidLoan() {
    await this.revealAndTap(this.loanDashboardRowId);
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
      [this.withdrawStepDoneId, this.withdrawCompletionCardId, this.backToMyLoansButtonId],
      () => this.signContractTransaction(),
      this.withdrawExecutionScreenId,
    );
  }

  @Step("Expect the withdraw completion card")
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

  /** Asserting the marker is absent first makes the wait afterwards proof that the step ran. */
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

  /** Two opt-in screens can sit in front of the review, in this order; both no-op when absent. */
  private async signContractTransaction() {
    await app.speculos.acceptEnableTransactionCheck();
    await app.speculos.acceptBlindSigningWarning();
    await app.speculos.signEvmContractTransaction();
  }

  private async revealAndTap(testId: string, timeout?: number) {
    await waitForWebElementToBeEnabled(testId, timeout);
    await scrollToWebElement(getWebElementByTestId(testId));
    await tapWebElementByTestId(testId);
  }

  private async expectStepDone(doneIds: string[]) {
    await app.common.disableSynchronizationForiOS();
    try {
      await this.awaitStepOutcome(doneIds);
    } finally {
      await app.common.enableSynchronization();
    }
  }

  /** Races the step markers against the execution error, so a failed step surfaces at once. */
  private async awaitStepOutcome(doneIds: string[]) {
    const deadline = Date.now() + EXECUTION_STEP_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (await this.isAnyPresent(doneIds)) return;
      if (await this.isPresent(getWebElementByCssSelector(this.executionErrorLocator))) {
        throw new Error(`Borrow execution failed before "${doneIds[0]}". ${MAINNET_FUNDING_HINT}`);
      }
      await sleep(EXECUTION_POLL_INTERVAL_MS);
    }
    throw new Error(
      `Borrow step "${doneIds.join('" / "')}" did not complete within ${EXECUTION_STEP_TIMEOUT_MS}ms. ${MAINNET_FUNDING_HINT}`,
    );
  }

  private async waitForAnyTestId(ids: string[], timeout: number) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await this.isAnyPresent(ids)) return;
      await sleep(EXECUTION_POLL_INTERVAL_MS);
    }
    throw new Error(`None of "${ids.join('" / "')}" appeared within ${timeout}ms`);
  }

  private async isAnyPresent(testIds: string[]): Promise<boolean> {
    for (const testId of testIds) {
      if (await this.isPresent(getWebElementByTestId(testId))) return true;
    }
    return false;
  }

  private async isPresent(element: WebElement): Promise<boolean> {
    try {
      await element.runScript(el => el.innerText);
      return true;
    } catch {
      return false;
    }
  }
}
