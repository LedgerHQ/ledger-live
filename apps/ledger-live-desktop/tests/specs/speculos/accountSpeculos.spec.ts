import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AddAccountModal } from "../../models/AddAccountModal";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { Device, specs, startSpeculos, stopSpeculos } from "../../utils/speculos";
import { Currency } from "../../enum/Currency";

test.use({ userdata: "skip-onboarding" });
const currencies: Currency[] = [
  Currency.BTC,
  Currency.tBTC,
  Currency.ETH,
  Currency.tETH,
  Currency.SOL,
  Currency.DOT,
  Currency.TRX,
  Currency.XRP,
  Currency.ADA,
];

let device: Device | undefined;

test.afterEach(async () => {
  await stopSpeculos(device);
});

test.describe.parallel("Accounts @smoke", () => {
  for (const currency of currencies) {
    let firstAccountName = "NO ACCOUNT NAME YET";
    let accountsListBeforeRemove: (string | null)[];
    test(`[${currency.uiName}] Add account`, async ({ page }) => {
      const portfolioPage = new PortfolioPage(page);
      const addAccountModal = new AddAccountModal(page);
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      device = await startSpeculos(test.name, specs[currency.deviceLabel.replace(/ /g, "_")]);

      await test.step(`[${currency.uiName}] Open modal`, async () => {
        await portfolioPage.openAddAccountModal();
        expect(await addAccountModal.title.textContent()).toBe("Add accounts");
        await expect(addAccountModal.selectAccount).toBeVisible();
      });

      await test.step(`[${currency.uiName}] Select currency`, async () => {
        await addAccountModal.select(currency.uiName);
        await page.mouse.move(0, 0); // prevent instability if select is hovered
        await addAccountModal.continue();
      });

      await test.step(`[${currency.uiName}] Open device app`, async () => {
        await addAccountModal.waitForSync();
        const name = await addAccountModal.getFirstAccountName();
        firstAccountName = name;
        await expect(addAccountModal.addNewAccount).toBeVisible();
      });

      await test.step(`[${currency.uiName}] Scan and add accounts`, async () => {
        await addAccountModal.addAccounts();
        await expect(addAccountModal.successAdd).toBeVisible();
      });

      await test.step(`[${currency.uiName}] Done`, async () => {
        await addAccountModal.done();
        await layout.totalBalance.waitFor({ state: "visible" });
      });

      await test.step(`Navigate to first account`, async () => {
        await layout.goToAccounts();
        accountsListBeforeRemove = await accountsPage.getAccountsName();
        await accountsPage.navigateToAccountByName(firstAccountName);
        await expect(accountPage.accountName(firstAccountName)).toBeVisible();
        await accountPage.settingsButton.waitFor({ state: "visible" });
      });

      await test.step(`scroll to operations`, async () => {
        await accountPage.scrollToOperations();
        await expect(accountPage.lastOperation).toBeVisible();
      });

      await test.step(`Delete current account`, async () => {
        await accountPage.deleteAccount();
        await expect(accountsPage.firstAccount).not.toBe(firstAccountName);
        const accountsListAfterRemove = await accountsPage.getAccountsName();
        expect(accountsListAfterRemove).not.toContain(accountsListBeforeRemove[0]);
      });
    });
  }
});
