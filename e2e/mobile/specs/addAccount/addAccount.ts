import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { getMergedFeatureFlags } from "../../utils/constants";

const BST_ADD_ACCOUNT_CURRENCIES = new Set(["ton", "aptos", "cardano", "tezos"]);

export function runAddAccountTest(currency: CurrencyType, tmsLinks: string[], tags: string[]) {
  describe("Add accounts - Network Based", () => {
    let isAssetSectionEnabled = false;

    beforeAll(async () => {
      const featureFlags = getMergedFeatureFlags();
      isAssetSectionEnabled = featureFlags.lwmWallet40?.params?.assetSection === true;

      await app.init({
        userdata: "skip-onboarding",
        speculosApp: currency.speculosApp,
        featureFlags,
      });
      await app.mainNavigation.waitForWallet40Ready();
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

      if (isAssetSectionEnabled) {
        await app.portfolio.checkAssetVisible(currency.name);
        await app.portfolio.openAssetDetail(currency.name, "up");
        await app.assetDetail.expectTotalBalanceVisible();
        await app.assetDetail.expectMarketPriceVisible();
        await app.assetDetail.expectOperationItemVisible();
        return;
      }

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
