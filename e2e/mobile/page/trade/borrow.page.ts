import { Step } from "jest-allure2-reporter/api";
import { readAccountNonces } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { byId } from "@e2e/helpers/elements/native";
import {
  waitForWebviewContent,
  waitForWebviewUrl,
  webByCss,
  webById,
  webByXPath,
  type WebHandle,
} from "@e2e/helpers/elements/web";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { TIMEOUT } from "@e2e/utils/timeouts";

const MODAL_DISMISS_TIMEOUT_MS = TIMEOUT.xlarge;
const CONTINUE_READY_TIMEOUT_MS = TIMEOUT.xlarge;
const EXECUTION_STEP_TIMEOUT_MS = 240_000;
const STEP_STATE_TIMEOUT_MS = TIMEOUT.xlarge;
const SCREEN_READY_TIMEOUT_MS = TIMEOUT.xxlarge;
const DASHBOARD_READY_TIMEOUT_MS = TIMEOUT.xxxlarge;

const MAINNET_FUNDING_HINT =
  "Ensure the test account holds enough wBTC collateral and ETH for mainnet gas.";

const anyTestId = (ids: string[]): string => ids.map(id => `[data-testid="${id}"]`).join(", ");

export default class BorrowPage {
  /** Ids that also build CSS selectors: the step outcome and the screens after Back to my loans. */
  private readonly introModalId = "borrow-intro-modal";
  private readonly giveApprovalButtonId = "give-approval-button";
  private readonly step1AccessApprovedId = "borrow-step-1-access-approved";
  private readonly step2DepositDoneId = "borrow-step-2-deposit-done";
  private readonly step3BorrowDoneId = "borrow-step-3-borrow-done";
  private readonly loanCompletionCardId = "borrow-loan-completion-card";
  private readonly viewMyLoanButtonId = "borrow-view-my-loan-button";
  private readonly getNewLoanButtonId = "borrow-get-new-loan-button";
  private readonly loansDashboardId = "borrow-loans-dashboard";
  private readonly repayStep1ApprovedId = "borrow-repay-step-1-access-approved";
  private readonly repayStep2DoneId = "borrow-repay-step-2-repay-done";
  private readonly repayCompletionCardId = "borrow-repay-completion-card";
  private readonly withdrawStepDoneId = "borrow-withdraw-step-done";
  private readonly deauthorizeBorrowingStepDoneId = "borrow-deauthorize-borrowing-step-done";
  private readonly withdrawCompletionCardId = "borrow-withdraw-completion-card";
  private readonly backToMyLoansButtonId = "borrow-back-to-my-loans-button";

  private readonly borrowScreen = byId("borrow-screen");
  private readonly body = webByCss("body");
  private readonly introModal = webById(this.introModalId);
  private readonly introModalTitle = webById("borrow-intro-modal-title");
  private readonly simulateMyLoanButton = webById("borrow-simulate-my-loan-button");
  private readonly simulateLoanScreen = webById("borrow-simulate-loan-screen");
  private readonly loanAmountInput = webById("borrow-loan-amount-input");
  private readonly simulateContinueButton = webById("borrow-simulate-continue-button");
  private readonly loanExecutionScreen = webById("borrow-loan-execution-screen");
  private readonly giveApprovalButton = webById(this.giveApprovalButtonId);
  private readonly authorizeDepositingButton = webById("borrow-authorize-depositing-button");
  private readonly authorizeBorrowingButton = webById("borrow-authorize-borrowing-button");
  private readonly viewMyLoanButton = webById(this.viewMyLoanButtonId);
  private readonly yourLoansTitle = webById("borrow-your-loans-title");
  private readonly loansDashboard = webById(this.loansDashboardId);
  private readonly loanDashboardRow = webById("borrow-loan-dashboard-row");
  /** Withdrawing the last loan empties the dashboard, so the no-loans screens count too. */
  private readonly loansLandingScreen = webByCss(
    anyTestId([this.loansDashboardId, this.getNewLoanButtonId, this.introModalId]),
  );

  private readonly repayButton = webById("borrow-repay-button");
  private readonly repayModal = webById("borrow-repay-modal");
  private readonly repayInFullButton = webById("borrow-repay-in-full-button");
  private readonly repayContinueButton = webById("borrow-repay-continue-button");
  private readonly repayExecutionScreen = webById("borrow-repay-execution-screen");
  private readonly authorizeRepayButton = webById("borrow-authorize-repay-button");
  private readonly repayCompletionCard = webById(this.repayCompletionCardId);

  private readonly withdrawOverviewScreen = webById("borrow-withdraw-overview-screen");
  private readonly withdrawCollateralButton = webById("borrow-withdraw-collateral-button");
  private readonly withdrawExecutionScreen = webById("borrow-withdraw-execution-screen");
  private readonly authorizeWithdrawButton = webById("borrow-authorize-withdraw-button");
  private readonly deauthorizeBorrowingButton = webById("borrow-deauthorize-borrowing-button");
  private readonly withdrawCompletionCard = webById(this.withdrawCompletionCardId);
  private readonly backToMyLoansButton = webById(this.backToMyLoansButtonId);

  private readonly executionErrorLocator =
    '[data-testid="borrow-execution-error"], [data-testid="borrow-on-chain-failed-message"]';

  /** The collateral row carries no test id, so it is matched on its symbol. */
  private readonly collateralButton = (symbol: string) =>
    webByXPath(`//*[(self::button or @role='button') and normalize-space(.)='${symbol}']`);

  private readonly keypadDigit = (digit: string) => webById(`custom-keyboard-key-${digit}`);

  private chainAccount?: string;

  /**
   * The borrow address cache lives in the test file's module realm, which this page object cannot
   * read, so the test hands the address over for the failure diagnostics.
   */
  setChainAccount(address: string | undefined) {
    this.chainAccount = address;
  }

  @Step("Expect borrow native screen visible")
  async expectBorrowScreenVisible() {
    await this.borrowScreen.waitVisible();
    await this.borrowScreen.expectVisible();
    await app.common.waitForWalletApiWebview();
    await waitForWebviewContent();
  }

  @Step("Open the borrow app from the portfolio entry point")
  async openFromPortfolio() {
    await app.portfolio.expectBorrowEntryPointVisible();
    await app.portfolio.clickBorrowEntryPoint();
    await this.expectBorrowScreenVisible();
  }

  @Step("Expect the Introducing Crypto Loan modal")
  async expectIntroModal() {
    await this.introModal.waitVisible();
    await this.introModalTitle.waitVisible();
    await this.introModal.expectExist();
    await this.introModalTitle.expectExist();
  }

  @Step("Click Simulate my loan on the intro modal")
  async clickSimulateMyLoan() {
    await this.simulateMyLoanButton.scrollToAndTap();
    await retryUntilTimeout(() => this.introModal.expectNotExist(), MODAL_DISMISS_TIMEOUT_MS);
  }

  @Step("Expect the simulate-loan screen")
  async expectSimulateLoanScreen() {
    await waitForWebviewUrl("/loan/simulate-loan");
    await this.simulateLoanScreen.waitVisible();
    await this.loanAmountInput.waitVisible();
    await this.simulateLoanScreen.expectExist();
    await this.loanAmountInput.expectExist();
  }

  /** The amount input is read-only; the value is driven by the keypad. */
  @Step("Type loan amount")
  async typeLoanAmount(amount: string) {
    await this.simulateLoanScreen.waitVisible();
    for (const digit of amount) {
      await this.keypadDigit(digit).scrollToAndTap();
    }
    await this.simulateContinueButton.waitEnabled(CONTINUE_READY_TIMEOUT_MS);
  }

  @Step("Expect the required collateral")
  async expectCollateral(symbol: string) {
    await this.collateralButton(symbol).waitVisible();
    await this.collateralButton(symbol).expectExist();
  }

  /** The LTV row carries no test id, so it is read off the rendered simulate-loan text. */
  @Step("Expect the loan to value")
  async expectLoanToValue(percentage: string) {
    await this.simulateLoanScreen.waitVisible();
    const screenText = await this.body.getText();
    if (!new RegExp(String.raw`Loan to Value[^\d]*${percentage}`).test(screenText)) {
      throw new Error(
        `Expected a loan to value of ${percentage} but the simulate-loan screen showed: ${screenText.replace(/\n+/g, " | ")}`,
      );
    }
  }

  @Step("Click Continue on the simulate-loan screen")
  async clickContinue() {
    await this.simulateContinueButton.scrollToAndTap(CONTINUE_READY_TIMEOUT_MS);
  }

  @Step("Expect the loan execution screen")
  async expectExecutionScreen() {
    await waitForWebviewUrl("/loan/loan-execution");
    await this.loanExecutionScreen.waitVisible();
    await this.loanExecutionScreen.expectExist();
  }

  /**
   * Granting Morpho access is on-chain state the account keeps, not part of this loan, so a run
   * that already granted it — an earlier attempt of this same test, most of all — opens with the
   * step complete and nothing to sign.
   */
  @Step("Give approval and sign on device")
  async completeApprovalStep() {
    await this.loanExecutionScreen.waitVisible();
    if (
      await this.isStepAlreadyDoneOnceRendered(
        this.step1AccessApprovedId,
        this.giveApprovalButtonId,
      )
    )
      return;
    await this.authorizeStep(this.giveApprovalButton, this.step1AccessApprovedId, () =>
      this.signContractTransaction(),
    );
  }

  @Step("Authorize depositing and sign on device")
  async authorizeDeposit() {
    await this.authorizeStep(this.authorizeDepositingButton, this.step2DepositDoneId, () =>
      this.signContractTransaction(),
    );
  }

  /** Completing the last step leaves the execution screen, so the terminal card counts too. */
  @Step("Authorize borrowing and sign on device")
  async authorizeBorrow() {
    await this.authorizeStep(
      this.authorizeBorrowingButton,
      [this.step3BorrowDoneId, this.loanCompletionCardId, this.viewMyLoanButtonId],
      () => this.signContractTransaction(),
    );
    await this.viewMyLoanButton.waitVisible();
  }

  @Step("Click View my loan")
  async clickViewMyLoan() {
    await this.viewMyLoanButton.scrollToAndTap();
  }

  @Step("Expect loans dashboard visible")
  async expectLoansDashboard() {
    await this.yourLoansTitle.waitVisible();
    await this.loansDashboard.waitVisible();
    await this.yourLoansTitle.expectExist();
    await this.loansDashboard.expectExist();
  }

  @Step("Expect at least one loan row on the dashboard")
  async expectLoanDashboardRow() {
    await this.loanDashboardRow.waitVisible();
    await this.loanDashboardRow.expectExist();
  }

  /** With a loan already open the live app skips the introduction and lists the position. */
  @Step("Expect the borrow app to open on the loans dashboard")
  async expectHotStartDashboard() {
    await this.loansDashboard.waitVisible(DASHBOARD_READY_TIMEOUT_MS);
    await this.yourLoansTitle.waitVisible();
    await this.loanDashboardRow.waitVisible();
    await this.loansDashboard.expectExist();
    await this.yourLoansTitle.expectExist();
    await this.loanDashboardRow.expectExist();
  }

  /** Anchored on the Repay CTA: `borrow-loan-overview-screen` is web-only in the live app. */
  @Step("Open the loan with debt from the dashboard")
  async openActiveLoan() {
    await this.loanDashboardRow.scrollToAndTap();
    await waitForWebviewUrl("/loanoverview/");
    await this.repayButton.waitEnabled(SCREEN_READY_TIMEOUT_MS);
  }

  @Step("Click Repay on the loan overview")
  async clickRepay() {
    await this.repayButton.scrollToAndTap();
    await this.repayModal.waitVisible();
  }

  @Step("Select Repay in full and continue to execution")
  async submitRepayInFull() {
    await this.repayInFullButton.scrollToAndTap();
    await this.repayContinueButton.scrollToAndTap();
    await waitForWebviewUrl("/forms/repay/");
    await this.repayExecutionScreen.waitVisible();
  }

  /** The spec zeroes the debt-token allowance beforehand, so this step is always required. */
  @Step("Give repay approval and sign on device")
  async completeRepayApprovalStep() {
    await this.authorizeStep(
      this.giveApprovalButton,
      this.repayStep1ApprovedId,
      () => this.signContractTransaction(),
      this.repayExecutionScreen,
    );
  }

  @Step("Authorize repay and sign on device")
  async authorizeRepay() {
    await this.authorizeStep(
      this.authorizeRepayButton,
      [this.repayStep2DoneId, this.repayCompletionCardId, this.viewMyLoanButtonId],
      () => this.signContractTransaction(),
      this.repayExecutionScreen,
    );
  }

  @Step("Expect the repay completion card")
  async expectRepaySuccess() {
    await this.repayCompletionCard.waitVisible();
    await this.viewMyLoanButton.waitVisible();
    await this.repayCompletionCard.expectExist();
    await this.viewMyLoanButton.expectExist();
  }

  /** A loan with no debt left routes straight to withdraw instead of the loan overview. */
  @Step("Open the repaid loan from the dashboard")
  async openRepaidLoan() {
    await this.loanDashboardRow.scrollToAndTap();
    await waitForWebviewUrl("/withdrawoverview/");
    await this.withdrawOverviewScreen.waitVisible();
  }

  @Step("Click Withdraw collateral")
  async clickWithdrawCollateral() {
    await this.withdrawCollateralButton.scrollToAndTap();
    await waitForWebviewUrl("/forms/withdraw/");
    await this.withdrawExecutionScreen.waitVisible();
  }

  @Step("Authorize withdraw and sign on device")
  async authorizeWithdraw() {
    await this.authorizeStep(
      this.authorizeWithdrawButton,
      this.withdrawStepDoneId,
      () => this.signContractTransaction(),
      this.withdrawExecutionScreen,
    );
  }

  /** Withdrawing the last loan's collateral also revokes Morpho's borrowing authorization. */
  @Step("Deauthorize borrowing and sign on device")
  async deauthorizeBorrowing() {
    await this.authorizeStep(
      this.deauthorizeBorrowingButton,
      [
        this.deauthorizeBorrowingStepDoneId,
        this.withdrawCompletionCardId,
        this.backToMyLoansButtonId,
      ],
      () => this.signContractTransaction(),
      this.withdrawExecutionScreen,
    );
  }

  @Step("Expect the withdraw completion card")
  async expectWithdrawSuccess() {
    await this.withdrawCompletionCard.waitVisible();
    await this.backToMyLoansButton.waitVisible();
    await this.withdrawCompletionCard.expectExist();
    await this.backToMyLoansButton.expectExist();
  }

  @Step("Click Back to my loans")
  async clickBackToMyLoans() {
    await this.backToMyLoansButton.scrollToAndTap();
    await this.loansLandingScreen.waitVisible(SCREEN_READY_TIMEOUT_MS);
  }

  /** Asserting the marker is absent first makes the wait afterwards proof that the step ran. */
  private async authorizeStep(
    button: WebHandle,
    doneIds: string | string[],
    sign: () => Promise<void>,
    screen = this.loanExecutionScreen,
  ) {
    const markers = Array.isArray(doneIds) ? doneIds : [doneIds];
    await screen.waitVisible();
    await webById(markers[0]).expectNotExist();
    await button.scrollToAndTap(EXECUTION_STEP_TIMEOUT_MS);
    await app.walletApiSignatureDrawer.expectVisible();
    await sign();
    await this.expectStepDone(markers);
  }

  /** Two opt-in screens can sit in front of the review, in this order; both no-op when absent. */
  private async signContractTransaction() {
    await app.speculos.acceptEnableTransactionCheck();
    await app.speculos.acceptBlindSigningWarning();
    await app.speculos.signEvmContractTransaction();
  }

  private async expectStepDone(doneIds: string[]) {
    await app.common.disableSynchronizationForiOS();
    try {
      await this.awaitStepOutcome(doneIds);
    } finally {
      await app.common.enableSynchronization();
    }
  }

  /** One selector covers the step markers and the execution error, so a failed step surfaces at once. */
  private async awaitStepOutcome(doneIds: string[]) {
    const outcome = webByCss(`${anyTestId(doneIds)}, ${this.executionErrorLocator}`);
    let shown: string;
    try {
      shown = await outcome.getIdentifier(EXECUTION_STEP_TIMEOUT_MS);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Borrow step "${doneIds.join('" / "')}" did not complete: ${reason}\n${await this.chainState()}`,
        { cause: error },
      );
    }
    if (!doneIds.includes(shown)) {
      throw new Error(`Borrow execution failed before "${doneIds[0]}". ${await this.chainState()}`);
    }
  }

  /** Tells a transaction still in flight (very likely dropped) apart from an unfunded account. */
  private async chainState(): Promise<string> {
    const address = this.chainAccount;
    if (!address) return MAINNET_FUNDING_HINT;
    try {
      const { latest, pending } = await readAccountNonces(address);
      if (pending > latest) {
        return (
          `Account ${address} is at nonce ${latest} with ${pending - latest} transaction(s) in ` +
          `flight — another process is spending from it, so the app's transaction was very likely ` +
          `dropped.`
        );
      }
      return `Account ${address} is at nonce ${latest} with nothing in flight. ${MAINNET_FUNDING_HINT}`;
    } catch (error) {
      return `Could not read chain state for ${address} (${error}). ${MAINNET_FUNDING_HINT}`;
    }
  }

  private async isStepAlreadyDoneOnceRendered(doneId: string, ctaId: string): Promise<boolean> {
    return retryUntilTimeout(async () => {
      if (await webById(doneId).isVisible(TIMEOUT.xxxsmall)) return true;
      if (await webById(ctaId).isVisible(TIMEOUT.xxxsmall)) return false;
      throw new Error(`neither '${doneId}' nor '${ctaId}' rendered on the execution screen`);
    }, STEP_STATE_TIMEOUT_MS);
  }
}
