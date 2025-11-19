import { knownDevices } from "../../models/devices";
import DeviceAction from "../../models/DeviceAction";

describe("Add account from modal", () => {
  let deviceAction: DeviceAction;
  const testedCurrency = Currency.BTC;
  const expectedBalance = "1.19576\u00a0BTC";
  const knownDevice = knownDevices.nanoX;
  let first = true;
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      featureFlags: {
        noah: {
          enabled: false,
        },
        llmModularDrawer: {
          enabled: true,
        },
      },
      knownDevices: [knownDevice],
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-786");
  it("open add accounts from modal", async () => {
    await app.portfolio.addAccount();
    await app.addAccount.importWithYourLedger();
  });

  $TmsLink("B2CQA-101");
  it("add Bitcoin accounts", async () => {
    await app.modularDrawer.performSearchByTicker(testedCurrency.ticker);
    await app.modularDrawer.selectCurrencyByTicker(testedCurrency.ticker);
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.waitAccountsDiscovery();
    await app.addAccount.expectAccountDiscovery(testedCurrency.name, testedCurrency.id, 0);
    await app.addAccount.finishAccountsDiscovery();
    await app.addAccount.tapCloseAddAccountCta();
  });

  $TmsLink("B2CQA-101");
  it("displays Bitcoin accounts page summary", async () => {
    await app.portfolio.goToAccounts(testedCurrency.name);
    await app.assetAccountsPage.waitForAccountPageToLoad(testedCurrency.name);
    await app.assetAccountsPage.expectAccountsBalance(expectedBalance);
  });
});
