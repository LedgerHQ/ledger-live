import { Application } from "../../page";

let app: Application;

const currencies = [
  { currency: "bitcoin", nanoApp: "Bitcoin", tmsLink: "B2CQA-101" },
  { currency: "ethereum", nanoApp: "Ethereum", tmsLink: "B2CQA-102" },
];

describe("Add accounts", () => {
  beforeAll(async () => {
    app = await Application.init("onboardingcompleted");
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  currencies.forEach(({ currency, nanoApp, tmsLink }) => {
    let deviceName: string;

    $TmsLink(tmsLink);
    it(`${currency}: add accounts`, async () => {
      await app.addAccount.openViaDeeplink();
      await app.addAccount.selectCurrency(currency);

      deviceName = await app.common.addSpeculos(nanoApp);

      await app.addAccount.startAccountsDiscovery();
      await app.addAccount.expectAccountDiscovery(currency, 1);
      await app.addAccount.finishAccountsDiscovery();
      await app.addAccount.tapSuccessCta();
      await app.account.waitForAccountPageToLoad(currency);
      await app.account.expectAccountBalanceVisible();
    });

    afterEach(async () => {
      await app.common.removeSpeculos(deviceName);
    });
  });
});
