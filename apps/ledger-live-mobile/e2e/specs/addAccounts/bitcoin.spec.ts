import { expect } from "detox";
import { DeviceModelId } from "@ledgerhq/devices";
import { loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import DeviceAction from "../../models/DeviceAction";
import AccountsPage from "../../models/accounts/accountsPage";
import AddAccountDrawer from "../../models/accounts/addAccountDrawer";
import { getElementByText } from "../../helpers";

let portfolioPage: PortfolioPage;
let deviceAction: DeviceAction;
let accountsPage: AccountsPage;
let addAccountDrawer: AddAccountDrawer;

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

describe("Add Bitcoin Accounts", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    accountsPage = new AccountsPage();
    addAccountDrawer = new AddAccountDrawer();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("open add accounts from portfolio", async () => {
    await addAccountDrawer.openViaDeeplink();
  });

  it("add Bitcoin accounts", async () => {
    await addAccountDrawer.selectCurrency("bitcoin");
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await addAccountDrawer.startAccountsDiscovery();
    await expect(getElementByText("Bitcoin 2")).toBeVisible();
    await addAccountDrawer.finishAccountsDiscovery();
    await addAccountDrawer.tapSuccessCta();
  });

  it("displays accounts page summary", async () => {
    await accountsPage.waitForAccountsCoinPageToLoad("Bitcoin");
    await expect(getElementByText("1.19576 BTC")).toBeVisible();
  });
});
