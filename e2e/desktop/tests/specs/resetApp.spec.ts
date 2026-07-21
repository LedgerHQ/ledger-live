import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { FileUtils } from "tests/utils/fileUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("Reset app", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
  });

  test(
    "Verify that user can Reset app",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-821",
      },
    },
    async ({ app, electronApp, userdataFile, relaunchApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      const appJsonBefore = await FileUtils.getAppJsonSize(userdataFile);
      await app.settings.goToHelpTab();
      await app.settings.resetApp();
      await app.settingsModal.checkResetModal();

      // A hard reset wipes the store and then asks the main process to relaunch
      // (app.relaunch() + app.quit()). app.relaunch() spawns a detached process
      // that Playwright cannot control and that would grab the single-instance
      // lock on the userdata dir. Neutralise it so the confirm only quits the
      // app; the test then owns the restart via relaunchApp().
      await electronApp.evaluate(({ app }) => {
        app.relaunch = () => {};
      });
      await app.settingsModal.clickOnConfirmButton();

      // Restart the app against the same userdata dir, exactly like reopening it.
      const restartedApp = await relaunchApp();

      // State was wiped, so the app now boots into onboarding.
      await restartedApp.onboarding.clickGetStartedButton();

      const appJsonAfter = await FileUtils.getAppJsonSize(userdataFile);
      await FileUtils.compareAppJsonSize(appJsonBefore, appJsonAfter);
    },
  );
});
