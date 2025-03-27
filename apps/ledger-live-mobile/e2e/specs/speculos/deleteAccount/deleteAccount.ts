import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";

export async function runDeleteAccountTest(account: AccountType, tmsLinks: string[]) {
  describe("Delete account", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
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
      await app.accounts.openViaDeeplink();
      await app.common.expectAccountName(account.accountName);
      await app.common.goToAccountByName(account.accountName);
      await app.account.openAccountSettings();
      await app.account.selectAccountDelete();
      await app.account.confirmAccountDelete();
      await app.accounts.openViaDeeplink();
      await app.accounts.expectAccountsNumber(0);
    });
  });
}
