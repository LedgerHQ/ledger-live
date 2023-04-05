import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { Modal } from "../../models/Modal";
import { PasswordlockModal } from "../../models/PasswordlockModal";
import { LockscreenPage } from "../../models/LockscreenPage";
import * as fs from "fs";

test.use({ userdata: "skip-onboarding" });

test("Enable password lock", async ({ page, userdataFile }) => {
  const layout = new Layout(page);
  const modal = new Modal(page);
  const passwordlockModal = new PasswordlockModal(page);
  const lockscreenPage = new LockscreenPage(page);

  const getUserdata = () => {
    const jsonFile = fs.readFileSync(userdataFile, "utf-8");
    return JSON.parse(jsonFile);
  };

  await test.step("Open password lock modal", async () => {
    await layout.goToSettings();
    await passwordlockModal.toggle();
    await expect.soft(passwordlockModal.container).toHaveScreenshot("set-passwordlock-modal.png");
  });

  await test.step("Enable password lock", async () => {
    await passwordlockModal.enablePassword("password", "password");
    await expect(layout.topbarLockButton).toBeVisible();
    await expect.soft(page).toHaveScreenshot("passwordlock-enabled.png");
  });

  await test.step("User data should be encrypted", async () => {
    // NOTE: this test might fail if other tests are running at the same time.
    expect.poll(() => typeof getUserdata().data.accounts).toBe("string");
  });

  await test.step("Open change password modal", async () => {
    await passwordlockModal.openChangePasswordModal();
    await expect.soft(passwordlockModal.container).toHaveScreenshot("changepassword-modal.png");
  });

  await test.step("Change password", async () => {
    await passwordlockModal.changePassword("password", "newpassword", "newpassword");
    await expect(layout.topbarLockButton).toBeVisible();
  });
  await test.step("Lock app", async () => {
    await layout.lockApp();
    await expect(lockscreenPage.container).toBeVisible();
    await expect(layout.logo).toBeVisible();
    await expect.soft(page).toHaveScreenshot("app-locked.png");
  });

  await test.step("I lost my password", async () => {
    await lockscreenPage.lostPassword();
    await expect.soft(modal.container).toHaveScreenshot("lockscreen-reset-app-modal.png");
    await modal.cancel();
  });

  await test.step("Unlock with wrong password", async () => {
    await lockscreenPage.login("wrong");
    await expect(layout.inputError).toBeVisible();
    await expect.soft(page).toHaveScreenshot("lockscreen-wrong-password.png");
  });

  await test.step("Unlock with correct password", async () => {
    await lockscreenPage.login("newpassword");
    await expect(lockscreenPage.container).toBeHidden();
    await expect.soft(page).toHaveScreenshot("lockscreen-unlocked.png");
    await expect(layout.topbarLockButton).toBeVisible();
  });

  await test.step("Open disable password lock modal", async () => {
    await passwordlockModal.toggle();
    await expect.soft(modal.container).toHaveScreenshot("disablepassword-modal.png");
  });

  await test.step("Disable password lock: Set wrong password", async () => {
    await passwordlockModal.disablePassword("password");
    await expect(layout.inputError).toBeVisible();
    await expect(layout.topbarLockButton).toBeVisible();
    await expect.soft(modal.container).toHaveScreenshot("passwordlock-disable-bad-password.png");
  });

  await test.step("Disable password lock: Set correct password", async () => {
    await passwordlockModal.disablePassword("newpassword");
    await expect(layout.topbarLockButton).toBeHidden();
    await expect.soft(page).toHaveScreenshot("passwordlock-disabled.png");
  });

  await test.step("User data shouldn't be encrypted", async () => {
    await expect.poll(() => typeof getUserdata().data.accounts).toBe("object");
  });
});
