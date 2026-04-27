import { Application } from "tests/page";

export async function verifyAddedFundedAccount(
  app: Application,
  userdataFile: string,
  accountName: string,
): Promise<void> {
  await app.portfolio.expectBalanceVisibility();
  await app.portfolio.expectAccountsPersistedInAppJson(userdataFile, 1, 5000);

  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(accountName);
  await app.account.expectAccountVisibility(accountName);
  await app.account.expectAccountBalance();
  await app.account.expectLastOperationsVisibility();

  const operationStatus = await app.account.clickOnLastOperationAndReturnStatus();
  await app.operationDrawer.expectDrawerInfos(accountName, operationStatus);
  await app.operationDrawer.closeDrawer();
  await app.account.expectAddressIndex(0);
  await app.account.expectShowMoreButton();
}
