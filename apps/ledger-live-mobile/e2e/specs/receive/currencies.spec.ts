import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

$TmsLink("B2CQA-651");
$TmsLink("B2CQA-1854");
describe("Receive different currency", () => {
  let deviceAction: DeviceAction;
  let first = true;
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      featureFlags: {
        noah: {
          enabled: false,
        },
      },
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it.each([
    ["bitcoin"],
    ["ethereum", "ethereum"],
    ["bsc"],
    ["ripple"],
    //["solana"], // TOFIX Error during flow
    ["cardano"],
    ["dogecoin"],
    // ["tron"], // TO FIX, scenario hangs
    ["avalanche_c_chain"],
    ["polygon", "polygon"],
    ["polkadot", "assethub_polkadot"],
    ["cosmos", "cosmos"],
  ])("receive on %p (through scanning)", async (currencyId: string, network: string = "") => {
    const currency = getCryptoCurrencyById(currencyId);
    const currencyName = getCryptoCurrencyById(currencyId).name;

    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.transferMenu.open();
    await app.transferMenu.navigateToReceive();
    await app.modularDrawer.performSearchByTicker(currency.ticker);
    await app.modularDrawer.selectCurrencyByTicker(currency.ticker);
    await app.modularDrawer.selectNetworkIfAsked(currency.name);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(currency.name, network || currency.id, 1);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(currency.ticker, `${currencyName} 2`);
  });
});
