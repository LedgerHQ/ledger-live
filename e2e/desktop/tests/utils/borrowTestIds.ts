/**
 * Playwright mirror of `borrow-live-app/packages/features/src/testIds.ts`.
 *
 * Keep values identical to the borrow live app catalog — do not import from
 * `@borrow/features` (barrel pulls React/observability and breaks test collection).
 */
export const BORROW_TEST_IDS = {
  introModal: "borrow-intro-modal",
  introModalTitle: "borrow-intro-modal-title",
  simulateMyLoanButton: "borrow-simulate-my-loan-button",
  simulateLoanScreen: "borrow-simulate-loan-screen",
  loanAmountInput: "borrow-loan-amount-input",
  simulateContinueButton: "borrow-simulate-continue-button",
  getNewLoanButton: "borrow-get-new-loan-button",
  loanExecutionScreen: "borrow-loan-execution-screen",
  giveApprovalButton: "give-approval-button",
  authorizeDepositingButton: "borrow-authorize-depositing-button",
  authorizeBorrowingButton: "borrow-authorize-borrowing-button",
  step1AccessApproved: "borrow-step-1-access-approved",
  step2DepositDone: "borrow-step-2-deposit-done",
  step3BorrowDone: "borrow-step-3-borrow-done",
  executionError: "borrow-execution-error",
  onChainFailedMessage: "borrow-on-chain-failed-message",
  loanCompletionCard: "borrow-loan-completion-card",
  viewMyLoanButton: "borrow-view-my-loan-button",
  yourLoansTitle: "borrow-your-loans-title",
  loansDashboard: "borrow-loans-dashboard",
  repayButton: "borrow-repay-button",
  learnMoreButton: "borrow-learn-more-button",
} as const;
