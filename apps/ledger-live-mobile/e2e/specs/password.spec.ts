import { device, expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import PasswordEntryPage from "../models/passwordEntryPage";
import { loadConfig } from "../bridge/server";
import { delay } from "../helpers";

const CORRECT_PASSWORD = "passWORD$123!";

let portfolioPage: PortfolioPage;
let settingsPage: SettingsPage;
let generalSettingsPage: GeneralSettingsPage;
let passwordEntryPage: PasswordEntryPage;

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    settingsPage = new SettingsPage();
    generalSettingsPage = new GeneralSettingsPage();
    passwordEntryPage = new PasswordEntryPage();
  });

  it("should open on Portofolio page", async () => {
    await expect(portfolioPage.getSettingsButton()).toBeVisible();
  });

  it("should go to Settings", async () => {
    await portfolioPage.navigateToSettings();
  });

  it("should go navigate to General settings", async () => {
    await settingsPage.navigateToGeneralSettings();
  });

  it("should toggle Password lock", async () => {
    await generalSettingsPage.togglePassword();
  });

  it("should enter password twice", async () => {
    await generalSettingsPage.enterNewPassword(CORRECT_PASSWORD + "\n"); // use a linebreak instead of pressing the confirm button to handle the keyboard if it appears
    await generalSettingsPage.enterNewPassword(CORRECT_PASSWORD + "\n"); // confirm password step
  });

  it("should not require the password if the user exits the app for less than the lock timeout", async () => {
    await device.sendToHome(); // leave LLM app and go to phone's home screen
    await delay(1000); // the timeout on prod is 1 minute. With mock mode enabled, it is 5 seconds
    await device.launchApp();
    await expect(generalSettingsPage.getPreferredCurrency()).toBeVisible();
  });

  it("should need to enter password to unlock app", async () => {
    await device.sendToHome();
    await delay(6000); // password takes 5 seconds of app inactivity to activate in mock mode. Using 6 seconds to be on the safe side.
    await device.launchApp(); // restart LLM
    await passwordEntryPage.enterPassword(CORRECT_PASSWORD);
    await passwordEntryPage.login();
  });

  it("should be back on General Settings page", async () => {
    await expect(generalSettingsPage.getPreferredCurrency()).toBeVisible();
  });
});
