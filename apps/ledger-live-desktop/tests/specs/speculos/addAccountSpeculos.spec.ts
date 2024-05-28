import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AddAccountModal } from "../../models/AddAccountModal";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { specs } from "../../utils/speculos";
import { Currency } from "../../enum/Currency";

const currencies: Currency[] = [
  Currency.BTC,
  Currency.tBTC,
  Currency.ETH,
  Currency.tETH,
  Currency.sepETH,
  Currency.XRP,
  Currency.DOT,
  Currency.TRX,
];

for (const [i, currency] of currencies.entries()) {
  test.describe.parallel("Accounts @smoke", () => {
    test.use({
      userdata: "skip-onboarding",
      testName: `addAccount_${currency.uiName}`,
      speculosCurrency: specs[currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });
    let firstAccountName = "NO ACCOUNT NAME YET";

    //@TmsLink("B2CQA-101")
    //@TmsLink("B2CQA-102")
    //@TmsLink("B2CQA-314")
    //@TmsLink("B2CQA-330")
    //@TmsLink("B2CQA-929")

    test(`[${currency.uiName}] Add account`, async ({ page }) => {
      const portfolioPage = new PortfolioPage(page);
      const addAccountModal = new AddAccountModal(page);
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);

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
        firstAccountName = await addAccountModal.getFirstAccountName();
      });

      await test.step(`[${currency.uiName}] Scan and add accounts`, async () => {
        await addAccountModal.addAccounts();
        await expect(addAccountModal.successAddLabel).toBeVisible();
      });

      await test.step(`[${currency.uiName}] Done`, async () => {
        await addAccountModal.done();
        await layout.totalBalance.waitFor({ state: "visible" });
      });

      await test.step(`Navigate to first account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(firstAccountName);
        await expect(accountPage.accountName(firstAccountName)).toBeVisible();
        await accountPage.settingsButton.waitFor({ state: "visible" });
      });

      await test.step(`scroll to operations`, async () => {
        await accountPage.scrollToOperations();
        await expect(accountPage.lastOperation).toBeVisible();
      });
    });
  });
}
