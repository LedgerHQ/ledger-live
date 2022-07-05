import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ReferralPage } from "../../models/referralPage";
import { Layout } from "../../models/Layout";
import { Modal } from "tests/models/Modal";
import { Drawer } from "tests/models/Drawer";
import { clipboard } from "electron";

test.use({ userdata: "1AccountBTC1AccountETH", manifest: "referral-staging" });

test("Referral Program", async ({ page, manifestFile }) => {
  const referralPage = new ReferralPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);

  await test.step("Navigate to Discover", async () => {
    await layout.goToDiscover();
  });

  await test.step("Launch App", async () => {
    await referralPage.launchApp("referral-staging-app");
    await expect.soft(page).toHaveScreenshot("open-app.png");
  });

  await test.step("Accept disclaimer", async () => {
    await drawer.continue();
  });

  await test.step("Copy referral link to Clipboard", async () => {
    await referralPage.copyLink();
    const text = clipboard.readText();
    await expect.soft(text).toBe("TIDUSFF10");
  });

  await test.step("Select BTC account", async () => {
    await page.pause();
    await referralPage.selectAccount("BTC");
  });

  await test.step("Sign up must fail", async () => {
    await referralPage.signUp("password", "diffPassword");
    await expect.soft(page).toHaveScreenshot("signup-fail.png");
    await referralPage.goBack();
  });

  await test.step("Sign up must success", async () => {
    await referralPage.signUp("password", "password");
    await expect.soft(page).toHaveScreenshot("signup-success.png");
    await referralPage.gotoAccount();
  });

  await test.step("Login must fail", async () => {
    await referralPage.login("wrongPassword");
    await expect.soft(page).toHaveScreenshot("login-fail.png");
  });

  await test.step("Login must success", async () => {
    await referralPage.login("password");
    await expect.soft(page).toHaveScreenshot("login-success.png");
  });

  await test.step("Copy referral link to Clipboard", async () => {
    await referralPage.copyLink();
    const clipText = await navigator.clipboard.readText();
    await expect.soft(clipText).toBe("TIDUSFF10");
  });

  await test.step("Claim reward", async () => {
    await referralPage.claim();
    await expect.soft(page).toHaveScreenshot("claim-success.png");
    await referralPage.ok();
  });

  await test.step("Delete account", async () => {
    await referralPage.delete("password");
  });
});
