import fs from "fs";
import { device } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import DebugSettingsPage from "../models/settings/debugSettingsPage";
import { loadConfig } from "../bridge/server";

/**
 * Note that when addings new errors the exported class name may or may not match the
 * internal name, because we are inconsistent. If the filter doesn't find anything check
 * the internal name used when the error is created.
 */
const items: string[] = [
  // // Empty to not disrupt the tests on CI
  // "LockedDeviceError",
  // "ManagerDeviceLocked",
  // "UpdateYourApp",
  // "UserRefusedDeviceNameChange",
  // "UserRefusedFirmwareUpdate",
  // "ImageLoadRefusedOnDevice",
  // "ImageCommitRefusedOnDevice",
  // "DeviceNotOnboarded",
  // "FwUpdateBluetoothNotSupported",
];

// Nb, since this spec is not run automatically but rather locally, fill the export
// path for the screenshots when you run it.
let outPath = "";

let portfolioPage: PortfolioPage;
let settingsPage: SettingsPage;
let debugSettingsPage: DebugSettingsPage;

beforeAll(async () => {
  await loadConfig("1AccountBTC1AccountETH", true);
  portfolioPage = new PortfolioPage();
  settingsPage = new SettingsPage();
  debugSettingsPage = new DebugSettingsPage();
});

describe("Error rendering tool", () => {
  it("Navigate to Debug Errors and generate screenshots", async () => {
    await portfolioPage.navigateToSettings();
    await settingsPage.navigateToDebugSettings();
    await debugSettingsPage.navigateToDebugFeaturesSettings();
    await debugSettingsPage.navigateToDebugErrors();

    // Do this twice, once for modals, once for full-screen
    for (const type of ["full", "modal"]) {
      for (const name of items) {
        // Open the selector
        await debugSettingsPage.openDebugErrorsSelector();
        await debugSettingsPage.selectErrorByName(name);

        if (type === "modal") {
          // We want the modal view, so toggle it before the screenshot
          await debugSettingsPage.toggleErrorRenderingType();
        }

        // We are in the tool now, create some sort of loop that goes over the errors and outputs
        // screenshots of the device.
        const dir = `${outPath}/${type}/`;
        const tempPath = await device.takeScreenshot(name);

        // Create folders if missing.
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Move screenshot to safety
        fs.renameSync(tempPath, `${dir}${name}.png`);

        if (type === "modal") {
          // Close the modal after the screenshot
          await debugSettingsPage.closeModal();
        }
      }
    }
  });
});
