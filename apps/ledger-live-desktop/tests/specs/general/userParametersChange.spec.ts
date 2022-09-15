import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";

test.use({ userdata: "skip-onboarding" });

test("User retrive data", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("user change currency", async () => {
    await layout.goToSettings();
    await settingsPage.changeCounterValue();
    await expect.soft(page.locator(".select__value-container").first()).toHaveText("Euro - EUR");
  });

  // await test.step("user change language", async () => {
  //   await layout.goToSettings();
  //   await settingsPage.changeLanguage();
  //   await expect
  //     .soft(
  //       page.locator(
  //         "div:nth-child(2) > .sc-dkzDqf.uXYMl > .css-198krsd-container > .select__control",
  //       ),
  //     )
  //     .toHaveText("Français");
  // });

  // await test.step("user change Theme", async () => {
  //   await layout.goToSettings();
  //   await settingsPage.changeTheme();
  //   await expect.soft(page.locator("#react-select-3-option-2")).toHaveText("Clair");
  // });
});
