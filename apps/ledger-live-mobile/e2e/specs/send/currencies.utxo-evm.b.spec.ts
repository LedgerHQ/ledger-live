import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";
import { sendCurrencyIdsUtxoEvmB } from "./sendCurrencyCases";
import { runSendCurrencyHalfBalanceFlow } from "./sendCurrencyHalfBalanceFlow";

$TmsLink("B2CQA-1823");
describe("Send flow (UTXO and EVM currencies) — set B", () => {
  let deviceAction: DeviceAction;
  const firstDeviceSelectRef = { value: true };
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      knownDevices: [knownDevice],
      testedCurrencies: sendCurrencyIdsUtxoEvmB,
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it.each(sendCurrencyIdsUtxoEvmB)(
    "%s: open send flow, sends half balance and displays the new operation",
    async currencyId => {
      await runSendCurrencyHalfBalanceFlow(deviceAction, firstDeviceSelectRef, currencyId);
    },
  );
});
