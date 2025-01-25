import { Application } from "../page";

const app = new Application();

const langButtonText = [
  { lang: "Français", localization: "Général" },
  { lang: "Español", localization: "General" },
  { lang: "Русский", localization: "Общие" },
  { lang: "Deutsch", localization: "Allgemeines" },
  { lang: "Português (Brasil)", localization: "Geral" },
  { lang: "Türkçe", localization: "Genel" },
  { lang: "简体中文", localization: "常规" },
  { lang: "한국어", localization: "일반" },
  { lang: "日本語", localization: "一般" },
  { lang: "English", localization: "General" },
];

const verifyLanguageCanBeChanged = (l10n: { lang: string; localization: string }) => {
  it(`should change selected language to ${l10n.lang}`, async () => {
    await app.settingsGeneral.navigateToLanguageSelect();
    await app.settingsGeneral.selectLanguage(l10n.lang);
    await app.settingsGeneral.expectLocalizedText(l10n.localization);
  });
};

$TmsLink("B2CQA-2344");
describe("Change Language", () => {
  beforeAll(async () => {
    await app.init({ userdata: "1AccountBTC1AccountETHReadOnlyFalse" });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should go to General Settings", async () => {
    await app.portfolio.navigateToSettings();
    await app.settings.navigateToGeneralSettings();
  });

  // test steps for each language
  for (const l10n of langButtonText) {
    verifyLanguageCanBeChanged(l10n);
  }
});
