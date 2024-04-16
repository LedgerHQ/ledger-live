import { device, expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import PasswordEntryPage from "../models/passwordEntryPage";
import { loadConfig } from "../bridge/server";

const CORRECT_PASSWORD = "passWORD$123!";

let portfolioPage: PortfolioPage;
let settingsPage: SettingsPage;
let generalSettingsPage: GeneralSettingsPage;
let passwordEntryPage: PasswordEntryPage;

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);

    portfolioPage = new PortfolioPage();
    settingsPage = new SettingsPage();
    generalSettingsPage = new GeneralSettingsPage();
    passwordEntryPage = new PasswordEntryPage();
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should ask for the password when lock is toggled", async () => {
    await portfolioPage.navigateToSettings();
    await settingsPage.navigateToGeneralSettings();
    await generalSettingsPage.togglePassword();
    await generalSettingsPage.enterNewPassword(CORRECT_PASSWORD);
    await generalSettingsPage.enterNewPassword(CORRECT_PASSWORD); // confirm password step
    await device.sendToHome();
    await device.launchApp(); // restart LLM
    await expect(passwordEntryPage.getPasswordTextInput()).toBeVisible();
  });

  it("should stay locked with incorrect password", async () => {
    await passwordEntryPage.enterPassword("INCORRECT_PASSWORD");
    await passwordEntryPage.login();
    await expect(passwordEntryPage.getPasswordTextInput()).toBeVisible();
  });

  it("should unlock with correct password", async () => {
    await passwordEntryPage.enterPassword(CORRECT_PASSWORD);
    await passwordEntryPage.login();
    await expect(passwordEntryPage.getPasswordTextInput()).not.toBeVisible();
    await expect(generalSettingsPage.preferredCurrencyButton()).toBeVisible();
  });
});
