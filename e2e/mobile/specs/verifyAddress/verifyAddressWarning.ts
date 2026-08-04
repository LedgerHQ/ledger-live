import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

type VerifyAddressWarningOptions = {
  skip?: boolean;
};

export function runVerifyAddressWarningTest(
  account: AccountType,
  expectedWarningMessage: string,
  tmsLinks: string[],
  tags: string[],
  options: VerifyAddressWarningOptions = {},
) {
  const describeFn = options.skip ? describe.skip : describe;

  describeFn("Receive", () => {
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
    it(`[${account.currency.testLabel}] - Verify address warning`, async () => {
      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapReceive();
      await app.receive.doNotVerifyAddress();
      await app.receive.expectReceiveWarningPageIsDisplayed(
        account.currency.ticker,
        account.accountName,
      );
      await app.receive.expectSendCurrencyTokensWarningMessage(expectedWarningMessage);
    });
  });
}
