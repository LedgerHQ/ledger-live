import { Account } from "@ledgerhq/live-common/lib/e2e/enum/Account";

$TmsLink("B2CQA-927", "B2CQA-928");
describe("Portfolio", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: Account.BTC_NATIVE_SEGWIT_1.currency.speculosApp,
      featureFlags: {
        llmAccountListUI: { enabled: true },
        llmNetworkBasedAddAccountFlow: { enabled: true },
      },
      cliCommands: [
        (userdataPath?: string) => {
          return CLI.liveData({
            currency: Account.BTC_NATIVE_SEGWIT_1.currency.speculosApp.name,
            index: Account.BTC_NATIVE_SEGWIT_1.index,
            add: true,
            appjson: userdataPath,
          });
        },
        (userdataPath?: string) => {
          return CLI.liveData({
            currency: Account.BTC_NATIVE_SEGWIT_1.currency.speculosApp.name,
            index: Account.BTC_NATIVE_SEGWIT_1.index,
            add: true,
            appjson: userdataPath,
          });
        },
        (userdataPath?: string) => {
          return CLI.liveData({
            currency: Account.BTC_NATIVE_SEGWIT_1.currency.speculosApp.name,
            index: Account.BTC_NATIVE_SEGWIT_1.index,
            add: true,
            appjson: userdataPath,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("Charts are displayed when user added his accounts", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.checkQuickActionButtonsVisibility();
    await app.portfolio.checkChartVisibility();
  });
});
