import { AccountType } from "@ledgerhq/live-common/e2e/enum/Account";

export async function runVerifyAddressTest(account: AccountType, tmsLinks: string[]) {
  describe("Verify Address", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [
          (userdataPath?: string) => {
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
    it(`Verify address on ${account.currency.name}`, async () => {
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
