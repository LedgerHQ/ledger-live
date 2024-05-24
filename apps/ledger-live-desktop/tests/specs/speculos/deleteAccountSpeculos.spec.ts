import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { specs } from "../../utils/speculos";
import { Account } from "../../enum/Account";

const accounts: Account[] = [
  Account.BTC_1,
  Account.tBTC_1,
  Account.ETH_1,
  Account.tETH_1,
  Account.sep_ETH_1,
  Account.SOL_1,
  Account.TRX_1,
  Account.DOT_1,
  Account.XRP_1,
];

for (const [i, account] of accounts.entries()) {
  test.describe.parallel("Accounts @smoke", () => {
    test.use({
      userdata: "speculos",
      testName: `deleteAccount_${account.currency.uiName}`,
      speculosCurrency: specs[account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    //@TmsLink("B2CQA-320")

    test(`[${account.currency.uiName}] Receive`, async ({ page }) => {
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);

      await test.step(`Navigate to ${account.currency.uiName} account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(account.accountName);
        await accountPage.settingsButton.waitFor({ state: "visible" });
      });

      await test.step(`Delete current account`, async () => {
        await accountPage.deleteAccount();
        expect(accountsPage.firstAccount).not.toBe(account.accountName);
        const accountsListAfterRemove = await accountsPage.getAccountsName();
        expect(accountsListAfterRemove).not.toContain(account.accountName);
      });
    });
  });
}
