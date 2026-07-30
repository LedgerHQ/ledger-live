import { CurrencyType } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const BST_ADD_ACCOUNT_CURRENCIES = new Set(["ton", "aptos", "cardano", "tezos"]);

export function runAddAccountTest(currency: CurrencyType, tmsLinks: string[], tags: string[]) {
  describe("Add account", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "skip-onboarding",
        speculosApp: currency.speculosApp,
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(BST_ADD_ACCOUNT_CURRENCIES.has(currency.id) ? Team.BST : Team.COIN_INTEGRATION);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it(`[${currency.testLabel}] - Add account`, async () => {
      await app.portfolio.addAccount();
      await app.addAccount.importWithYourLedger();
      await app.modularDrawer.performSearchByTicker(currency.ticker);
      await app.modularDrawer.selectCurrencyByTicker(currency.ticker);
      await app.modularDrawer.selectNetworkIfAsked(currency.name);

      const accountId = await app.addAccount.addAccountAtIndex(
        `${currency.name} 1`,
        currency.id,
        0,
      );

      await app.addAccount.tapCloseAddAccountCta();

      await app.portfolio.goToAccounts(currency.name, currency.id);

      await app.assetAccountsPage.waitForAccountPageToLoad(currency.name, currency.id, true);
      await app.assetAccountsPage.expectAccountsBalanceVisible();
      await app.common.goToAccount(accountId, currency.id);
      await app.account.expectAccountBalanceVisible(accountId);
      await app.account.expectOperationHistoryVisible(accountId);
      await app.account.expectAddressIndex(0);
    });
  });
}
