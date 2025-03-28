import { knownDevices } from "../../models/devices";
import DeviceAction from "../../models/DeviceAction";

describe("Add account from modal", () => {
  let deviceAction: DeviceAction;
  const testedCurrency = "Bitcoin";
  const expectedBalance = "1.19576\u00a0BTC";
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      featureFlags: {
        llmNetworkBasedAddAccountFlow: {
          enabled: true,
          overridesRemote: true,
        },
      },
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
    await app.receive.selectCurrency(testedCurrency);
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.addAccount.waitAccountsDiscovery();
    await app.addAccount.expectNetworkBasedAccountDiscovery(
      testedCurrency,
      testedCurrency.toLowerCase(),
      0,
    );
    await app.addAccount.finishAccountsDiscovery();
    await app.addAccount.tapCloseAddAccountCta();
  });

  $TmsLink("B2CQA-101");
  it("displays Bitcoin accounts page summary", async () => {
    await app.portfolio.goToAccounts(testedCurrency);
    await app.assetAccountsPage.waitForAccountPageToLoad(testedCurrency);
    await app.assetAccountsPage.expectAccountsBalance(expectedBalance);
  });
});
