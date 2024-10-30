import { Application } from "../../../page";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export async function runAddAccountTest(currency: Currency, tmsLink: string) {
  let app: Application;
  let deviceNumber: number;

  describe(`Add accounts - ${currency.name}`, () => {
    beforeAll(async () => {
      app = await Application.init("onboardingcompleted");
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    $TmsLink(tmsLink);
    it(`Perform an add account`, async () => {
      await app.addAccount.openViaDeeplink();
      await app.common.performSearch(currency.name);
      await app.addAccount.selectCurrency(currency.currencyId);

      deviceNumber = await app.common.addSpeculos(currency.speculosApp.name);

      const accountId = await app.addAccount.addFirstAccount(currency);
      await app.assetAccountsPage.waitForAccountPageToLoad(currency.name);
      await app.assetAccountsPage.expectAccountsBalanceVisible();
      await app.assetAccountsPage.goToAccount(accountId);
      await app.account.expectAccountBalanceVisible(accountId);
      await app.account.expectOperationHistoryVisible(accountId);
      await app.account.expectAddressIndex(0);
    });

    afterAll(async () => {
      await app.common.removeSpeculos(deviceNumber);
    });
  });
}
