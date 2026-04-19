import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";
import { receiveCurrencyCasesUtxoEvm } from "./receiveCurrencyCases";
import { runReceiveCurrencyScanningFlow } from "./receiveCurrencyScanningFlow";

$TmsLink("B2CQA-651");
$TmsLink("B2CQA-1854");
describe("Receive different currency (UTXO and EVM)", () => {
  let deviceAction: DeviceAction;
  const firstDeviceSelectRef = { value: true };
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

  it.each(receiveCurrencyCasesUtxoEvm)(
    "receive on %p (through scanning)",
    async (currencyId: string, network = "") => {
      await runReceiveCurrencyScanningFlow(deviceAction, firstDeviceSelectRef, currencyId, network);
    },
  );
});
