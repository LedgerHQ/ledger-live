import { device, expect } from "detox";
import { stubString } from "lodash/fp";
import PortfolioPage from "../models/wallet/portfolioPage";
import SettingsPage from "../models/settings/settingsPage";
import GeneralSettingsPage from "../models/settings/generalSettingsPage";
import { loadConfig } from "../bridge/server";
import { delay } from "../helpers";

let portfolioPage: PortfolioPage;
let settingsPage: SettingsPage;
let generalSettingsPage: GeneralSettingsPage;

describe("Change Language", () => {
  const langButtonText = [
    { lang: "Français", localization: "Général" },
    { lang: "Español", localization: "General" },
    { lang: "Русский", localization: "Общие" },
    { lang: "Deutsch", localization: "Allgemeines" },
    { lang: "Português", localization: "Geral" },
    { lang: "Türkçe", localization: "Genel" },
    { lang: "简体中文", localization: "一般条款" },
    { lang: "한국어", localization: "일반" },
    { lang: "日本語", localization: "一般" },
  ];
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    settingsPage = new SettingsPage();
    generalSettingsPage = new GeneralSettingsPage();
  });

  it("should go to Settings", async () => {
    await portfolioPage.navigateToSettings();
  });

  it("should go navigate to General settings", async () => {
    await settingsPage.navigateToGeneralSettings();
  });

  it("Settings page should be in English", async () => {
    await expect(generalSettingsPage.isEnglish()).toBeVisible();
  });

  describe("should select the language", () => {
    for (const l10n of langButtonText) {
      // eslint-disable-next-line no-loop-func
      it("should open language selection page", async () => {
        await generalSettingsPage.navigateToLanguageSelect();
      });
      // eslint-disable-next-line no-loop-func
      it(`should select [${l10n.lang}]`, async () => {
        await generalSettingsPage.selectLanguage(l10n.lang);
      });
      // eslint-disable-next-line no-loop-func
      it(`Settings page should be localized to [${l10n.localization}]`, async () => {
        await expect(
          generalSettingsPage.isLocalized(l10n.localization),
        ).toBeVisible();
      });
    }
  });
});
