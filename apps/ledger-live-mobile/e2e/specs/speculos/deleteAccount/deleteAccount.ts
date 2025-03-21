import { CLI } from "../../../utils/cliUtils";
import { Application } from "../../../page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export async function runDeleteAccountTest(account: Account, tmsLinks: string[]) {
  const app = new Application();

  describe("Delete account", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [
          async () => {
            return CLI.liveData({
              currency: account.currency.currencyId,
              index: account.index,
              appjson: app.userdataPath,
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
