import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "skip-onboarding" });

test("Settings", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("go to settings", async () => {
    await layout.goToSettings();
  });

  await test.step("go to settings -> developer", async () => {
    await settingsPage.goToAccountsTab();
    await settingsPage.enableAndGoToDeveloperTab();
  });

  await test.step("open modal local manifest form creation", async () => {
    await settingsPage.openLocalManifestFormButton.click();
  });

  await test.step("create local manifest", async () => {
    await settingsPage.createLocalManifestButton.click();
    await expect(page.getByText("ReplaceAppName")).toBeVisible();
  });

  await test.step("export the local manifest", async () => {
    await expect(settingsPage.exportLocalManifestButton).toBeVisible();
    //Unable to reach the OS Dialog box to test the content
  });
});
