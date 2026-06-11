import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const BST_ADD_ACCOUNT_CURRENCIES = new Set(["ton", "aptos", "cardano", "tezos"]);

export function runAddAccountTest(currency: CurrencyType, tmsLinks: string[], tags: string[]) {
  describe("Add accounts - Network Based", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "skip-onboarding",
        speculosApp: currency.speculosApp,
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    setTeamOwner(BST_ADD_ACCOUNT_CURRENCIES.has(currency.id) ? Team.BST : Team.COIN_INTEGRATION);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it(`Perform a Network Based add account - ${currency.name}`, async () => {
      await app.portfolio.addAccount();
      await app.addAccount.importWithYourLedger();

      const isModularDrawer = await app.modularDrawer.isFlowEnabled("add_account");
      if (isModularDrawer) {
        await app.modularDrawer.performSearchByTicker(currency.ticker);
        await app.modularDrawer.selectCurrencyByTicker(currency.ticker);
        await app.modularDrawer.selectNetworkIfAsked(currency.name);
      } else {
        await app.common.performSearch(currency.id);
        await app.receive.selectCurrency(currency.id);
        await app.receive.selectNetworkIfAsked(currency.id);
      }

      const accountId = await app.addAccount.addAccountAtIndex(
        `${currency.name} 1`,
        currency.id,
        0,
      );

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
