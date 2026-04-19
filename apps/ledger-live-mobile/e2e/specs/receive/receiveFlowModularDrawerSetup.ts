import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";

export const receiveFlowKnownDevice = knownDevices.nanoX;

export async function initReceiveFlowModularDrawerApp(): Promise<void> {
  await app.init({
    userdata: "EthAccountXrpAccountReadOnlyFalse",
    knownDevices: [receiveFlowKnownDevice],
    featureFlags: {
      noah: {
        enabled: false,
      },
    },
  });
}

export async function openReceiveModularDrawerFlow(): Promise<void> {
  await app.portfolio.openViaDeeplink();
  await app.portfolio.waitForPortfolioPageToLoad();
  await app.transferMenu.open();
  await app.transferMenu.navigateToReceive();
}

export async function selectMockDeviceOnce(
  firstDeviceSelectRef: { value: boolean },
  deviceAction: DeviceAction,
): Promise<void> {
  if (firstDeviceSelectRef.value) {
    await deviceAction.selectMockDevice();
    firstDeviceSelectRef.value = false;
  }
}
