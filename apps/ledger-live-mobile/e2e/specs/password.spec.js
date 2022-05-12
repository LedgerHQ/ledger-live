import PortfolioPage from "../models/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import PasswordEntryPage from "../models/passwordEntryPage";
import { delay } from "../helpers";
import { loadConfig } from "../bridge/server";

const CORRECT_PASSWORD = "passWORD$123!";

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should be able to enter the correct password", async () => {
    await loadConfig("1AccountBTC1AccountETH", true);

    await PortfolioPage.waitForPageToBeVisible();
    await PortfolioPage.navigateToSettings();
    await SettingsPage.navigateToGeneralSettings();
    await GeneralSettingsPage.togglePassword();
    await GeneralSettingsPage.enterNewPassword(CORRECT_PASSWORD);
    await GeneralSettingsPage.enterNewPassword(CORRECT_PASSWORD); // confirm password step
    await device.sendToHome(); // leave LLM app and go to phone's home screen
    await delay(60001); // password takes 60 seconds of app inactivity to activate
    await device.launchApp(); // restart LLM
    await PasswordEntryPage.enterPassword(CORRECT_PASSWORD);
    await PasswordEntryPage.login();
    await GeneralSettingsPage.isVisible();
  });
});
