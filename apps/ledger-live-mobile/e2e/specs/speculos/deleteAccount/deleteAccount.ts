import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";

export async function runDeleteAccountTest(account: AccountType, tmsLinks: string[]) {
  describe("Delete account", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        featureFlags: {
          llmAccountListUI: { enabled: true },
          llmNetworkBasedAddAccountFlow: { enabled: true },
        },
        cliCommands: [
          async (userdataPath?: string) => {
            return CLI.liveData({
              currency: account.currency.id,
              index: account.index,
              appjson: userdataPath,
              add: true,
            });
          },
        ],
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    it(`Perform a delete account - ${account.accountName}`, async () => {
      await app.account.openViaDeeplink();
      await app.account.expectAccountName(account.accountName);
      await app.account.goToAccountByName(account.accountName);
      await app.account.openAccountSettings();
      await app.account.selectAccountDelete();
      await app.account.confirmAccountDelete();
      await app.accounts.openViaDeeplink();
      await app.accounts.expectNoAccount();
    });
  });
}
