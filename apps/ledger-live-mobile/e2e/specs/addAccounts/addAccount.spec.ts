import { knownDevices } from "../../models/devices";
import DeviceAction from "../../models/DeviceAction";
import { Application } from "../../page";

let app: Application;
let deviceAction: DeviceAction;

const testedCurrency = "bitcoin";
const expectedBalance = "1.19576\u00a0BTC";
const knownDevice = knownDevices.nanoX;

describe("Add account from modal", () => {
  beforeAll(async () => {
    app = await Application.init({
      userdata: "onboardingcompleted",
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
    await app.addAccount.startAccountsDiscovery();
    await app.addAccount.expectAccountDiscovery(testedCurrency, 1);
    await app.addAccount.finishAccountsDiscovery();
    await app.addAccount.tapSuccessCta();
  });

  $TmsLink("B2CQA-101");
  it("displays Bitcoin accounts page summary", async () => {
    await app.account.waitForAccountPageToLoad(testedCurrency);
    await app.account.expectAccountBalance(expectedBalance);
  });
});
