import { device } from "detox";
import PortfolioPage from "../models/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import PasswordEntryPage from "../models/passwordEntryPage";
import { delay } from "../helpers";
import { loadConfig } from "../bridge/server";

const CORRECT_PASSWORD = "passWORD$123!";

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
  });

  it("should open on Portofolio page", async () => {
    await PortfolioPage.waitForPageToBeVisible();
  });

  it("should go to Settings", async () => {
    await PortfolioPage.navigateToSettings();
  });

  it("should go navigate to General settings", async () => {
    await SettingsPage.navigateToGeneralSettings();
  });

  it("should toggle Password lock", async () => {
    await GeneralSettingsPage.togglePassword();
  });

  it("should enter password twice", async () => {
    await GeneralSettingsPage.enterNewPassword(CORRECT_PASSWORD);
    await GeneralSettingsPage.enterNewPassword(CORRECT_PASSWORD); // confirm password step
  });

  it("should puts app in background and wait 1 minute and 1 second", async () => {
    await device.sendToHome(); // leave LLM app and go to phone's home screen
    await delay(60001); // password takes 60 seconds of app inactivity to activate
  });

  it("should move the app to foreground", async () => {
    await device.launchApp(); // restart LLM
  });

  it("should need to enter password to unlock app", async () => {
    await PasswordEntryPage.enterPassword(CORRECT_PASSWORD);
    await PasswordEntryPage.login();
  });

  it("should be back on General Settings page", async () => {
    await GeneralSettingsPage.isVisible();
  });
});
