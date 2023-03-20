import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import { loadConfig } from "../bridge/server";

let portfolioPage: PortfolioPage;
let settingsPage: SettingsPage;
let generalSettingsPage: GeneralSettingsPage;

const verifyLanguageCanBeChanged = (l10n: {
  lang: string;
  localization: string;
}) => {
  it(`should change selected language to ${l10n.lang}`, async () => {
    await generalSettingsPage.navigateToLanguageSelect();
    await generalSettingsPage.selectLanguage(l10n.lang);
    await expect(
      generalSettingsPage.isLocalized(l10n.localization),
    ).toBeVisible();
  });
};

describe("Change Language", () => {
  const langButtonText = [
    { lang: "Français", localization: "Général" },
    { lang: "Español", localization: "General" },
    { lang: "Русский", localization: "Общие" },
    { lang: "Deutsch", localization: "Allgemeines" },
    { lang: "Português (Brasil)", localization: "Geral" },
    { lang: "Türkçe", localization: "Genel" },
    { lang: "简体中文", localization: "一般条款" },
    { lang: "한국어", localization: "일반" },
    { lang: "日本語", localization: "一般" },
    { lang: "English", localization: "General" },
  ];

  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    settingsPage = new SettingsPage();
    generalSettingsPage = new GeneralSettingsPage();
  });

  it("should go to General Settings", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.navigateToSettings();
    await settingsPage.navigateToGeneralSettings();
  });

  // test steps for each language
  for (const l10n of langButtonText) {
    verifyLanguageCanBeChanged(l10n);
  }
});
