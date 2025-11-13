import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";

describe("Receive Flow", () => {
  let deviceAction: DeviceAction;
  const btcReceiveAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";
  let first = true;
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "EthAccountXrpAccountReadOnlyFalse",
      knownDevices: [knownDevice],
      featureFlags: {
        llmModularDrawer: {
          enabled: true,
          params: {
            add_account: false,
            live_app: false,
            live_apps_allowlist: [],
            live_apps_blocklist: [],
            receive_flow: true,
            send_flow: false,
            enableModularization: true,
            searchDebounceTime: 300,
            backendEnvironment: "STAGING",
          },
        },
      },
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  async function openReceive() {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.transferMenu.open();
    await app.transferMenu.navigateToReceive();
  }

  $TmsLink("B2CQA-1864");
  it("Should verify the address after importing an account working on a single network", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("Bitcoin");
    await app.modularDrawer.selectCurrencyByTicker(Currency.BTC.ticker);

    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.BTC.name, Currency.BTC.id, 0);
    await app.addAccount.tapAddFunds();
    await app.addAccount.tapReceiveinActionDrawer();
    await app.receive.selectVerifyAddress();
    await deviceAction.openApp();
    await app.receive.expectAddressIsVerified(btcReceiveAddress);
    await deviceAction.complete();
    await app.receive.expectAddressIsDisplayed(btcReceiveAddress);
  });

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("Ethereum");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.expectNumberOfAccountInListIsDisplayed("ethereum", 4);
    await app.modularDrawer.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    const currency = Currency.OP;
    await openReceive();
    await app.modularDrawer.performSearchByTicker("Ethereum");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.selectNetworkIfAsked(currency.name);

    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.OP.name, Currency.OP.id, 2);
    await app.receive.expectAccountIsCreated("OP Mainnet 3");
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("Ethereum");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.selectNetworkIfAsked("arbitrum");
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex("Arbitrum", "arbitrum", 0);
    await app.addAccount.tapAddFunds();
    await app.addAccount.tapReceiveinActionDrawer();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("ETH", "Arbitrum 1");
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("XRP");
    await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
    await app.modularDrawer.selectAccount(1);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
