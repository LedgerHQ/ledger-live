/**
 * Developer Settings Screenshot Test
 *
 * This test takes a screenshot of the Developer settings page to detect
 * visual regressions, including Tailwind CSS configuration issues.
 *
 * If this test fails, it may indicate:
 * - UI changes in the Developer settings
 * - Tailwind configuration has changed
 * - The lumen-design-core preset has been updated
 */

import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "skip-onboarding" });

test.describe("Developer Settings", () => {
  test("should render Developer settings correctly", async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    const layout = new Layout(page);

    await test.step("navigate to Settings", async () => {
      await layout.goToSettings();
    });

    await test.step("enable Developer mode and go to Developer tab", async () => {
      await settingsPage.enableAndGoToDeveloperTab();
    });

    await test.step("take screenshot of Developer settings", async () => {
      await page.getByTestId("developer-user-id").waitFor({ state: "visible" });
      await expect.soft(page).toHaveScreenshot("developer-settings.png", {
        mask: [page.getByTestId("developer-user-id")],
      });
    });
  });
});
