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
    ["tron"],
    ["avalanche_c_chain"],
    ["polygon", "polygon"],
    ["polkadot"],
    ["cosmos", "cosmos"],
  ])("receive on %p (through scanning)", async (currencyId: string, network: string = "") => {
    const currency = getCryptoCurrencyById(currencyId);
    const currencyName = getCryptoCurrencyById(currencyId).name;

    await app.receive.openViaDeeplink();
    await app.common.performSearch(currencyName);
    await app.receive.selectCurrency(currency.id);
    if (network) await app.receive.selectNetwork(network);
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(currency.name, currency.id, 1);
    await app.addAccount.tapAddFunds();
    await app.addAccount.tapReceiveinActionDrawer();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(currency.ticker, `${currencyName} 2`);
  });
});
