import { device } from "detox";
import { Application } from "../page";

const app = new Application();

const CORRECT_PASSWORD = "passWORD$123!";

describe("Password Lock Screen", () => {
  beforeAll(async () => {
    await app.init({ userdata: "1AccountBTC1AccountETHReadOnlyFalse" });
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
