import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { Modal } from "../../component/modal.component";
import { PasswordlockModal } from "../../page/modal/passwordlock.modal";
import { LockscreenPage } from "../../page/lockscreen.page";
import fsPromises from "fs/promises";

test.use({ userdata: "skip-onboarding" });

test("Enable password lock", async ({ page, userdataFile }) => {
  const layout = new Layout(page);
  const modal = new Modal(page);
  const passwordlockModal = new PasswordlockModal(page);
  const lockscreenPage = new LockscreenPage(page);

  const getUserdata = async () => {
    const jsonFile = await fsPromises.readFile(userdataFile, "utf-8");
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
    await expect.poll(async () => typeof (await getUserdata()).data.accounts).toBe("string");
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
    await expect.poll(async () => typeof (await getUserdata()).data.accounts).toBe("object");
  });
});
