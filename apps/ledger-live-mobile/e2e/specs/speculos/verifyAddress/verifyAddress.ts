import { CLI } from "../../../utils/cliUtils";
import { Application } from "../../../page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export async function runVerifyAddressTest(account: Account, tmsLink: string) {
  const app = new Application();

  describe(`Verify Address - ${account.currency.name}`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [
          () => {
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

    $TmsLink(tmsLink);
    it(`Verify address on ${account.currency.name}`, async () => {
      await app.accounts.openViaDeeplink();
      await app.common.goToAccountByName(account.accountName);
      await app.account.tapReceive();
      await app.receive.selectVerifyAddress();
      const displayedAddress = await app.receive.getFreshAddressDisplayed();
      await app.speculos.expectValidAddressDevice(account, displayedAddress);
      await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
      await app.receive.expectAddressIsCorrect(displayedAddress);
    });

    afterAll(async () => {
      await app?.common.removeSpeculos();
    });
  });
}
