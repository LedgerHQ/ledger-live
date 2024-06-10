import { expect } from "detox";
import { knownDevice } from "../../models/devices";
import DeviceAction from "../../models/DeviceAction";
import { getElementByText, waitForElementByText } from "../../helpers";
import { Application } from "../../page/index";

let app: Application;
let deviceAction: DeviceAction;

describe("Add account from modal", () => {
  beforeAll(async () => {
    app = await Application.init("onboardingcompleted", [knownDevice]);
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
    await app.addAccount.selectCurrency("bitcoin");
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.addAccount.startAccountsDiscovery();
    await expect(getElementByText("Bitcoin 2")).toBeVisible();
    await app.addAccount.finishAccountsDiscovery();
    await app.addAccount.tapSuccessCta();
  });

  $TmsLink("B2CQA-101");
  it("displays Bitcoin accounts page summary", async () => {
    await app.account.waitForAccountPageToLoad("Bitcoin");
    await waitForElementByText("1.19576\u00a0BTC");
  });
});
