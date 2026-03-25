$TmsLink("B2CQA-2344");

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

const langButtonText = [
  {
    lang: "Français",
    localization: "Général",
    characterSet: /[\u00C0-\u024F]/,
    translatedLabels: [
      { testId: "language-button", text: "Langue d\u2019affichage" },
      { testId: "countervalue-settings-row", text: "Monnaie préférée" },
      { testId: "data-format-button", text: "Format de date" },
    ],
    tags: ["@smoke", "@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "Русский",
    localization: "Общие",
    characterSet: /[\u0400-\u04FF]/,
    translatedLabels: [
      { testId: "language-button", text: "Язык" },
      { testId: "countervalue-settings-row", text: "Предпочтительная валюта" },
      { testId: "data-format-button", text: "Формат даты" },
    ],
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "日本語",
    localization: "一般",
    characterSet: /[\u4E00-\u9FFF]/,
    translatedLabels: [
      { testId: "language-button", text: "表示言語" },
      { testId: "countervalue-settings-row", text: "優先する通貨" },
      { testId: "data-format-button", text: "日付形式" },
    ],
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
];

const nanoApp = AppInfos.ETHEREUM;

describe("Change Language", () => {
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

  for (const l10n of langButtonText) {
    const isSmoke = l10n.tags.includes("@smoke");
    const shouldSkip = isSmokeTestRun && !isSmoke;

    l10n.tags.forEach(tag => $Tag(tag));
    (shouldSkip ? it.skip : it)(`should change selected language to ${l10n.lang}`, async () => {
      await app.settingsGeneral.navigateToLanguageSelect();
      await app.settingsGeneral.selectLanguage(l10n.lang);
      await app.settingsGeneral.expectLocalizedText(l10n.localization);
      await app.settingsGeneral.expectCharacterSet(
        l10n.translatedLabels[1].testId,
        l10n.characterSet,
      );
      for (const label of l10n.translatedLabels) {
        await app.settingsGeneral.expectTranslatedRow(label.testId, label.text);
      }
    });
  }
});
