import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";

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

  describeFn("Verify Address warnings", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account)],
      });
      await app.portfolio.waitForPortfolioPageToLoad();
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Verify address warning for ${account.currency.name}`, async () => {
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
