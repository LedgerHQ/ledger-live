import { knownDevices } from "../models/devices";

export async function initDeeplinksMockApp(): Promise<void> {
  await app.init({
    userdata: "1AccountBTC1AccountETHReadOnlyFalse",
    knownDevices: [knownDevices.nanoX],
    featureFlags: {
      noah: {
        enabled: false,
      },
    },
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}
