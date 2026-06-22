import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

export function runDeleteAccountTest(account: AccountType, tmsLinks: string[], tags: string[]) {
  describe("Delete account", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
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
