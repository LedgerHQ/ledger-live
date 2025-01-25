import { device } from "detox";
import { Application } from "../../page";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { CLI } from "../../utils/cliUtils";

const app = new Application();
const nanoApp = AppInfos.ETHEREUM;

const CORRECT_PASSWORD = "passWORD$123!";

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: nanoApp,
      cliCommands: [
        async () => {
          return CLI.liveData({
            currency: nanoApp.name,
            index: 0,
            appjson: app.userdataPath,
            add: true,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1763");
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
  it("should stay locked with incorrect password", async () => {
    await app.passwordEntry.enterPassword("INCORRECT_PASSWORD");
    await app.passwordEntry.login();
    await app.passwordEntry.expectLock();
  });

  $TmsLink("B2CQA-1763");
  it("should unlock with correct password", async () => {
    await app.passwordEntry.enterPassword(CORRECT_PASSWORD);
    await app.passwordEntry.login();
    await app.passwordEntry.expectNoLock();
    await app.settingsGeneral.expectpreferredCurrencyButton();
  });
});
