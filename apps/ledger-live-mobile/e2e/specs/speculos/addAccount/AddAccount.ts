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

      await app.addAccount.startAccountsDiscovery();
      await app.addAccount.expectAccountDiscovery(currency.name, currency.currencyId);
      await app.addAccount.finishAccountsDiscovery();
      await app.addAccount.tapSuccessCta();
      await app.account.waitForAccountPageToLoad(currency.name);
      await app.account.expectAccountBalanceVisible();
    });

    afterAll(async () => {
      await app.common.removeSpeculos(deviceNumber);
    });
  });
}
