import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";

export async function runAddAccountTest(currency: CurrencyType, tmsLink: string) {
  describe("Add accounts - Network Based", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "skip-onboarding",
        speculosApp: currency.speculosApp,
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    $TmsLink(tmsLink);
    it(`Perform a Network Based add account - ${currency.name}`, async () => {
      await app.portfolio.addAccount();
      await app.addAccount.importWithYourLedger();
      await app.common.performSearch(currency.name);
      await app.receive.selectCurrency(currency.id);
      await app.receive.selectNetworkIfAsked(currency.id);

      const accountId = await app.addAccount.addAccountAtIndex(currency.name, currency.id, 0);
      await app.addAccount.tapCloseAddAccountCta();

      await app.portfolio.goToAccounts(currency.name);
      await app.assetAccountsPage.waitForAccountPageToLoad(currency.name);
      await app.assetAccountsPage.expectAccountsBalanceVisible();
      await app.common.goToAccount(accountId);
      await app.account.expectAccountBalanceVisible(accountId);
      await app.account.expectOperationHistoryVisible(accountId);
      await app.account.expectAddressIndex(0);
    });
  });
}
