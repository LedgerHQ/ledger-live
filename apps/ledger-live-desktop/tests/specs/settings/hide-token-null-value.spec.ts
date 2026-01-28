import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";
import { AccountsPage } from "tests/page/accounts.page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { AccountPage } from "tests/page/account.page";

test.use({
  userdata: "1AccountETH0ValueToken",
});

test("Hide Token Null Value", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);

  await test.step("check if operations is not filtered by zero amount", async () => {
    await layout.goToSettings();
    await settingsPage.goToAccountsTab();
    await settingsPage.filterTokenOperationsZeroAmountToggleClick();
    expect(await settingsPage.isFilterTokenOperationsZeroAmountToggleChecked()).toBe(false);
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName(Account.ETH_2.accountName);
    await accountPage.scrollToOperations();

    const mainAccountOperationRowNoValue = page.getByTestId(
      "operation-row-mock_op_0_mock:1:ethereum:true_ethereum_1:",
    );
    expect(mainAccountOperationRowNoValue).toBeVisible();
    expect(await mainAccountOperationRowNoValue.textContent()).not.toContain("ETH");

    const mainAccountOperationWithValue = page.getByTestId(
      "operation-row-mock_op_1_mock:1:ethereum:true_ethereum_1:",
    );
    expect(mainAccountOperationWithValue).toBeVisible();
    expect(await mainAccountOperationWithValue.textContent()).toContain("ETH");

    await page.getByTestId("token-row-USDC").click();
    await accountPage.scrollToOperations();

    const tokenAccountOperationRowNoValue = page.getByTestId(
      "operation-row-mock_op_0_mock:1:ethereum:true_ethereum_1:|1",
    );
    expect(tokenAccountOperationRowNoValue).toBeVisible();
    expect(await tokenAccountOperationRowNoValue.textContent()).not.toContain("USDC");

    const tokenAccountOperationRowWithValue = page.getByTestId(
      "operation-row-mock_op_1_mock:1:ethereum:true_ethereum_1:|1",
    );
    expect(tokenAccountOperationRowWithValue).toBeVisible();
    expect(await tokenAccountOperationRowWithValue.textContent()).toContain("USDC");
  });

  await test.step("check if operations is filtered by zero amount", async () => {
    await layout.goToSettings();
    await settingsPage.goToAccountsTab();
    await settingsPage.filterTokenOperationsZeroAmountToggleClick();
    expect(await settingsPage.isFilterTokenOperationsZeroAmountToggleChecked()).toBe(true);
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName(Account.ETH_2.accountName);
    await accountPage.scrollToOperations();

    const mainAccountOperationRowNoValue = page.getByTestId(
      "operation-row-mock_op_0_mock:1:ethereum:true_ethereum_1:",
    );
    expect(mainAccountOperationRowNoValue).toBeVisible();
    expect(await mainAccountOperationRowNoValue.textContent()).not.toContain("ETH");

    const mainAccountOperationWithValue = page.getByTestId(
      "operation-row-mock_op_1_mock:1:ethereum:true_ethereum_1:",
    );
    expect(mainAccountOperationWithValue).toBeVisible();
    expect(await mainAccountOperationWithValue.textContent()).toContain("ETH");

    await page.getByTestId("token-row-USDC").click();
    await accountPage.scrollToOperations();

    await expect(
      page.getByTestId("operation-row-mock_op_0_mock:1:ethereum:true_ethereum_1:|1"),
    ).toHaveCount(0);

    const tokenAccountOperationRowWithValue = page.getByTestId(
      "operation-row-mock_op_1_mock:1:ethereum:true_ethereum_1:|1",
    );
    expect(tokenAccountOperationRowWithValue).toBeVisible();
    expect(await tokenAccountOperationRowWithValue.textContent()).toContain("USDC");
  });
});
