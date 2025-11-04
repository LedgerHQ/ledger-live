import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";

export function runAddAccountTest(
  currency: CurrencyType,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
) {
  describe("Add accounts - Network Based", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "skip-onboarding",
        speculosApp: currency.speculosApp,
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));
    it(`Perform a Network Based add account - ${currency.name}`, async () => {
      await app.portfolio.addAccount();

      const isModularDrawer = await app.modularDrawer.isModularDrawerVisible();
      await app.addAccount.importWithYourLedger();

      if (isModularDrawer) {
        console.log("MAD");
        await app.common.disableSynchronizationForiOS();
        await app.modularDrawer.performSearch(currency);
        await app.modularDrawer.selectCurrency(currency.name);
        await app.modularDrawer.selectNetworkIfAsked(currency.name);
      } else {
        console.log("NOT MAD");
        await app.common.performSearch(currency.id);
        await app.receive.selectCurrency(currency.id);
        await app.receive.selectNetworkIfAsked(currency.id);
      }

      await app.common.enableSynchronization();

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
