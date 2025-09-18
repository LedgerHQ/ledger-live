import { device } from "detox";

const tags: string[] = ["@NanoSP", "@LNS", "@NanoX"];
describe("Password Lock Screen", () => {
  const nanoApp = AppInfos.ETHEREUM;
  const CORRECT_PASSWORD = "passWORD$123!";

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

  $TmsLink("B2CQA-1763");
  tags.forEach(tag => $Tag(tag));
  it("should ask for the password when lock is toggled", async () => {
    await app.portfolio.navigateToSettings();
    await app.settings.navigateToGeneralSettings();
    await app.settingsGeneral.togglePassword();
    await app.settingsGeneral.enterNewPassword(CORRECT_PASSWORD);
    await app.settingsGeneral.enterNewPassword(CORRECT_PASSWORD); // confirm password step
    await device.sendToHome();
    await device.launchApp(); // restart LLM
    await app.passwordEntry.expectLock();
  });

  $TmsLink("B2CQA-2343");
  tags.forEach(tag => $Tag(tag));
  it("should stay locked with incorrect password", async () => {
    await app.passwordEntry.enterPassword("INCORRECT_PASSWORD");
    await app.passwordEntry.login();
    await app.passwordEntry.expectLock();
  });

  $TmsLink("B2CQA-1763");
  tags.forEach(tag => $Tag(tag));
  it("should unlock with correct password", async () => {
    await app.passwordEntry.enterPassword(CORRECT_PASSWORD);
    await app.passwordEntry.login();
    await app.passwordEntry.expectNoLock();
    await app.settingsGeneral.expectPreferredCurrencyButton();
  });
});
