import { CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { AccountType, TokenAccount } from "@ledgerhq/live-common/lib/e2e/enum/Account";

export function runAddAccountTest(
  currency: CurrencyType,
  tmsLinks: string[],
  tags: string[] = ["@NanoSP", "@LNS", "@NanoX"],
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

export function runAddSubAccountTest(
  asset: AccountType | TokenAccount,
  tmslinks: string[],
  tags: string[],
  withParentAccount: boolean,
) {
  describe(
    withParentAccount ? "Add subAccount when parent exists" : "Add subAccount without parent",
    () => {
      beforeAll(async () => {
        app.init({
          userdata: withParentAccount ? "speculos-subAccount" : "skip-onboarding",
          speculosApp: asset.currency.speculosApp,
        });
        await app.portfolio.waitForPortfolioPageToLoad();
      });

      tmslinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      it(
        withParentAccount
          ? `[${asset.currency.speculosApp.name}] Add subAccount when parent exists (${asset.currency.ticker}) - LLM`
          : `Add Sub Account without parent (${asset.currency.speculosApp.name}) - ${asset.currency.ticker} - LLM`,
        async () => {
          if (withParentAccount) {
            await app.portfolio.tapTabSelector("Accounts");
            await app.addAccount.tapAddNewOrExistingAccountButton();
          } else {
            await app.portfolio.addAccount();
          }

          await app.addAccount.importWithYourLedger();
          await app.common.performSearch(
            asset?.parentAccount === undefined ? asset.currency.id : asset.currency.name,
          );
          await app.receive.selectCurrency(asset.currency.id);

          const networkId =
            asset?.parentAccount === undefined
              ? asset.currency.speculosApp.name.toLowerCase()
              : asset?.parentAccount?.currency.id;
          await app.receive.selectNetworkIfAsked(networkId);

          const accountId = await app.addAccount.addAccountAtIndex(
            asset?.parentAccount === undefined
              ? asset.accountName
              : asset.parentAccount.accountName,
            asset?.parentAccount === undefined
              ? `${asset.currency.id}:${asset.address}`
              : asset.parentAccount.currency.id,
            asset.index,
          );

          await app.common.goToAccount(accountId);
          await app.account.expectAccountBalanceVisible(accountId);
          await app.account.expectOperationHistoryVisible(accountId);
          await app.account.navigateToTokenInAccount(asset);
        },
      );
    },
  );
}
