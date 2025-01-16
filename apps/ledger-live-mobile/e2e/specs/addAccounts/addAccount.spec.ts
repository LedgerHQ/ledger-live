import { knownDevices } from "../../models/devices";
import DeviceAction from "../../models/DeviceAction";
import { Application } from "../../page";
import { capitalize } from "../../models/currencies";

const app = new Application();
let deviceAction: DeviceAction;

const testedCurrency = "bitcoin";
const expectedBalance = "1.19576\u00a0BTC";
const knownDevice = knownDevices.nanoX;

describe("Add account from modal", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
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
    await app.addAccount.selectCurrency(testedCurrency);
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.addAccount.waitAccountsDiscovery();
    await app.addAccount.expectAccountDiscovery(capitalize(testedCurrency), testedCurrency, 0);
    await app.addAccount.finishAccountsDiscovery();
    await app.addAccount.tapSuccessCta();
  });

  $TmsLink("B2CQA-101");
  it("displays Bitcoin accounts page summary", async () => {
    await app.assetAccountsPage.waitForAccountPageToLoad(testedCurrency);
    await app.assetAccountsPage.expectAccountsBalance(expectedBalance);
  });
});
