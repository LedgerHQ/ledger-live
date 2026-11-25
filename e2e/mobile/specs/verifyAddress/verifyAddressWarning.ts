import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import type { TestMetaOptions } from "@e2e/models/testOptions";

type VerifyAddressWarningOptions = TestMetaOptions & {
  account: AccountType;
  expectedWarningMessage: string;
  skip?: boolean;
};

export function runVerifyAddressWarningTest(options: VerifyAddressWarningOptions) {
  const { account, expectedWarningMessage, tmsLinks, tags, skip } = options;
  const describeFn = skip ? describe.skip : describe;

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
      await app.receive.expectReceiveWarningPageIsDisplayed({
        tickerName: account.currency.ticker,
        accountName: account.accountName,
      });
      await app.receive.expectSendCurrencyTokensWarningMessage(expectedWarningMessage);
    });
  });
}
