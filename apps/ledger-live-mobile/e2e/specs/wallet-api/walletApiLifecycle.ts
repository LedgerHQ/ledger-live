import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";

const knownDevice = knownDevices.nanoX;

export async function beforeAllWalletApi(): Promise<DeviceAction> {
  await app.init({
    userdata: "1AccountBTC1AccountETHReadOnlyFalse",
    knownDevices: [knownDevice],
  });
  await app.dummyWalletApp.startApp();

  await app.portfolio.waitForPortfolioPageToLoad();
  await app.dummyWalletApp.openApp();
  await app.dummyWalletApp.expectApp();
  return new DeviceAction(knownDevice);
}

export async function afterAllWalletApi() {
  await app.dummyWalletApp.stopApp();
}

export async function afterEachWalletApi() {
  await app.dummyWalletApp.clearStates();
}
