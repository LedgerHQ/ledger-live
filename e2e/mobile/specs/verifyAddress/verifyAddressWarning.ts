import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";

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

    setTeamOwner(coinTeamOwner(account.currency.id), { folder: TestFolder.RECEIVE });
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.testLabel}] - Verify address - tokens warning`, async () => {
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
