import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";

export const receiveFlowKnownDevice = knownDevices.nanoX;

export async function initReceiveFlowApp(): Promise<DeviceAction> {
  await app.init({
    userdata: "EthAccountXrpAccountReadOnlyFalse",
    knownDevices: [receiveFlowKnownDevice],
    featureFlags: {
      noah: {
        enabled: false,
      },
    },
  });
  const deviceAction = new DeviceAction(receiveFlowKnownDevice);
  await app.portfolio.waitForPortfolioPageToLoad();
  return deviceAction;
}

export async function openReceive() {
  await app.portfolio.openViaDeeplink();
  await app.portfolio.waitForPortfolioPageToLoad();
  await app.transferMenu.open();
  await app.transferMenu.navigateToReceive();
}
