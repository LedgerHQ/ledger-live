import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { Layout } from "../../component/layout.component";
import { AccountsPage } from "../../page/accounts.page";

test.use({ userdata: "1AccountCardano" });

test.describe("Cardano Delegation", () => {
  test("No delegation state", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);

    await test.step("Navigate to Cardano account", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName("Cardano No Delegation");
    });

    await test.step("Verify empty delegation state", async () => {
      await expect(page.getByTestId("delegation-empty-state")).toBeVisible();
      await expect(page.locator("id=account-delegate-button")).toBeVisible();
    });
  });

  test("Active delegation state", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);

    await test.step("Navigate to Cardano account", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName("Cardano Active Delegation");
    });

    await test.step("Verify active delegation details", async () => {
      await expect(page.getByTestId("delegation-row")).toBeVisible();
      await expect(page.getByTestId("delegation-pool-name")).toContainText("LITHER - Lither Pool");
      await expect(page.getByTestId("delegation-amount")).toContainText("500"); // 500 ADA (balance 500,000,000)
      await expect(page.getByTestId("delegation-rewards")).toContainText("5"); // 5 ADA (rewards 5,000,000)
    });

    await test.step("Verify context menu options", async () => {
      await page.getByTestId("delegation-context-menu-button").click();
      await expect(page.getByTestId("delegation-redelegate-button")).toBeVisible();
      await expect(page.getByTestId("delegation-undelegate-button")).toBeVisible();
    });

    await test.step("Open Change Delegation modal", async () => {
      await page.getByTestId("delegation-redelegate-button").click();
      await expect(page.getByTestId("modal-container")).toBeVisible();
      await expect(page.getByText("Delegate")).toBeVisible();
      await page.getByTestId("modal-close-button").click();
    });

    await test.step("Open Stop Delegation modal", async () => {
      await page.getByTestId("delegation-context-menu-button").click();
      await page.getByTestId("delegation-undelegate-button").click();
      await expect(page.getByTestId("modal-container")).toBeVisible();
      await expect(page.getByText("Undelegate")).toBeVisible();
    });
  });

  test("Undelegate flow - summary step", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);

    await test.step("Navigate to Cardano account with active delegation", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName("Cardano Active Delegation");
    });

    await test.step("Open undelegate modal from context menu", async () => {
      await page.getByTestId("delegation-context-menu-button").click();
      await page.getByTestId("delegation-undelegate-button").click();
      await expect(page.getByTestId("modal-container")).toBeVisible();
    });

    await test.step("Verify undelegate summary step content", async () => {
      await expect(page.getByTestId("undelegate-refund-label")).toBeVisible();
      await expect(page.getByTestId("undelegate-fees-label")).toBeVisible();
      await expect(page.getByTestId("undelegate-continue-button")).toBeVisible();
    });

    await test.step("Close the modal", async () => {
      await page.getByTestId("modal-close-button").click();
    });
  });

  test("Undelegate without DRep delegation", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);

    await test.step("Navigate to Cardano account with rewards and no dRep delegation", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName("Cardano Self Tx Info");
    });

    await test.step("Open undelegate from context menu - should show self-tx info modal", async () => {
      await page.getByTestId("delegation-context-menu-button").click();
      await page.getByTestId("delegation-undelegate-button").click();
      await expect(page.getByTestId("modal-container")).toBeVisible();
    });

    await test.step("Verify self-tx info modal content", async () => {
      // The modal should show self-transaction info
      await expect(page.getByTestId("modal-continue-button")).toBeVisible();
    });
  });
});
