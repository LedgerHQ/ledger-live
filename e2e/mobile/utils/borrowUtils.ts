import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

export const openLoanSpeculosAppName = Account.ETH_4.currency.speculosApp.name;

/** Portfolio navigation — reuse portfolio page helpers; borrow screen assert stays on BorrowPage. */
export async function openBorrowFromPortfolioEntryPoint() {
  await app.mainNavigation.openPortfolioViaDeeplink();
  await app.portfolio.expectBorrowEntryPointVisible();
  await app.portfolio.clickBorrowEntryPoint();
  await app.borrow.expectBorrowScreenVisible();
}

export async function signEvmContractOnDevice() {
  await app.speculos.acceptEnableTransactionCheck();
  await app.speculos.signEvmContractTransaction();
}

export async function signTokenApprovalOnDevice() {
  await app.speculos.signTokenApproval();
}
