const langButtonText = [
  { lang: "Français", localization: "Général", isSmoke: false },
  { lang: "Español", localization: "General", isSmoke: true },
  { lang: "Русский", localization: "Общие", isSmoke: false },
  { lang: "Deutsch", localization: "Allgemeines", isSmoke: false },
  { lang: "Português (Brasil)", localization: "Geral", isSmoke: false },
  { lang: "Türkçe", localization: "Genel", isSmoke: false },
  { lang: "简体中文", localization: "常规", isSmoke: false },
  { lang: "한국어", localization: "일반", isSmoke: false },
  { lang: "日本語", localization: "一般", isSmoke: false },
  { lang: "English", localization: "General", isSmoke: false },
];

$TmsLink("B2CQA-2344");
const tags: string[] = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  ...(langButtonText.some(l => l.isSmoke) ? ["@smoke"] : []),
];
tags.forEach(tag => $Tag(tag));
describe("Change Language", () => {
  const verifyLanguageCanBeChanged = (l10n: {
    lang: string;
    localization: string;
    isSmoke: boolean;
  }) => {
    it(`should change selected language to ${l10n.lang}`, async () => {
      await app.settingsGeneral.navigateToLanguageSelect();
      await app.settingsGeneral.selectLanguage(l10n.lang);
      await app.settingsGeneral.expectLocalizedText(l10n.localization);
    });
  };
  const nanoApp = AppInfos.ETHEREUM;

  beforeAll(async () => {
    await app.init({
      speculosApp: nanoApp,
      cliCommands: [
        async (userdataPath?: string) => {
          return CLI.liveData({
            currency: nanoApp.name,
            index: 0,
            appjson: userdataPath,
            add: true,
          });
        },
      ],
    });
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
