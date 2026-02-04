$TmsLink("B2CQA-2344");

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

const langButtonText = [
  {
    lang: "Français",
    localization: "Général",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "Español",
    localization: "General",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@smoke"],
  },
  {
    lang: "Русский",
    localization: "Общие",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "Deutsch",
    localization: "Allgemeines",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "Português (Brasil)",
    localization: "Geral",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "Türkçe",
    localization: "Genel",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "简体中文",
    localization: "常规",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "한국어",
    localization: "일반",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "日本語",
    localization: "一般",
    tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
  },
  {
    lang: "English",
    localization: "General",
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
    });
  }
});

//todo: implement more checks on the Test + visual of the app (Bruno - poc)
//todo: Check only for arabic, latin, asian characters
