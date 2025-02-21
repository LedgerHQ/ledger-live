import { Application } from "../../../page";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export async function runAddAccountTest(currency: Currency, tmsLink: string) {
  const app = new Application();

  describe("Add accounts", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "skip-onboarding",
        speculosApp: currency.speculosApp,
        featureFlags: {
          llmNetworkBasedAddAccountFlow: {
            enabled: false,
            overridesRemote: true,
          },
        },
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    $TmsLink(tmsLink);
    it(`Perform an add account - ${currency.name}`, async () => {
      await app.addAccount.openViaDeeplink();
      await app.common.performSearch(currency.name);
      await app.addAccount.selectCurrency(currency.currencyId);

      const accountId = await app.addAccount.addFirstAccount(currency);
      await app.assetAccountsPage.waitForAccountPageToLoad(currency.name);
      await app.assetAccountsPage.expectAccountsBalanceVisible();
      await app.common.goToAccount(accountId);
      await app.account.expectAccountBalanceVisible(accountId);
      await app.account.expectOperationHistoryVisible(accountId);
      await app.account.expectAddressIndex(0);
    });
  });
}
