import { device } from "detox";
import { delay } from "../helpers/commonHelpers";

describe("Password Lock Screen", () => {
  const CORRECT_PASSWORD = "passWORD$123!";

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
    // Recurring JS timers post-RN-0.81 keep Detox's idle sync from completing during
    // background transitions; opt out around sendToHome/launchApp to avoid the hang.
    await device.disableSynchronization();
    try {
      await device.sendToHome();
      await delay(1000); // can be to fast for the app to be in the background
      await device.launchApp(); // restart LLM
    } finally {
      await device.enableSynchronization();
    }
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
