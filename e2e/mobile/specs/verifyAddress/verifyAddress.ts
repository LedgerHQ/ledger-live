import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

export function runVerifyAddressTest(account: AccountType, tmsLinks: string[], tags: string[]) {
  describe("Receive", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(Team.COIN_INTEGRATION);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.testLabel}] - Verify address`, async () => {
      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapReceive();
      await app.receive.selectVerifyAddress();
      const displayedAddress = await app.receive.getFreshAddressDisplayed();
      await app.speculos.expectValidAddressDevice(account, displayedAddress);
      await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
      await app.receive.expectAddressIsCorrect(displayedAddress);
    });
  });
}
