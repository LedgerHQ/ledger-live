import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AddAccountModal } from "../../models/AddAccountModal";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { spawn } from "child_process";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import SpeculosTransportWebsocket from "@ledgerhq/hw-transport-node-speculos";

test.use({ userdata: "skip-onboarding" });
const currencies = ["btc"];

test.describe.parallel("Accounts @smoke", () => {
  for (const currency of currencies) {
    let firstAccountName = "NO ACCOUNT NAME YET";
    //Doit cree le speculos mais marche pas
    test.beforeAll(async () => {
      const speculosProcess = spawn(
        "docker",
        [
          "run",
          "--rm",
          "-it",
          "-v",
          `"$(pwd)"/apps:/speculos/apps`,
          "-p",
          "1234:1234",
          "-p",
          "5000:5000",
          "-p",
          "40000:40000",
          "-p",
          "41000:41000",
          "-e",
          "SPECULOS_APPNAME=Bitcoin:2.0.1",
          "speculos",
          "--model",
          "nanos",
          "./apps/btc.elf",
          "--sdk",
          "2.0",
          "--seed",
          '"SEED SEED SEED SEED ..."',
          "--display",
          "headless",
          "--apdu-port",
          "40000",
          "--vnc-port",
          "41000",
        ],
        { shell: true },
      );
      await new Promise(resolve => {
        speculosProcess.on("exit", resolve);
      });
    });

    /*afterAll(async () => {
      kill le speculos
    });*/

    test(`[${currency}] Add account`, async ({ page }) => {
      const portfolioPage = new PortfolioPage(page);
      const addAccountModal = new AddAccountModal(page);
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);

      await test.step(`[${currency}] Open modal`, async () => {
        await portfolioPage.openAddAccountModal();
        expect(await addAccountModal.title.textContent()).toBe("Add accounts");
        await expect.soft(addAccountModal.container).toHaveScreenshot(`open-modal.png`);
      });

      await test.step(`[${currency}] Select currency`, async () => {
        await addAccountModal.select(currency);
        await page.mouse.move(0, 0); // prevent instability if select is hovered
        await expect.soft(addAccountModal.container).toHaveScreenshot(`${currency}-select.png`);
        await addAccountModal.continue();
      });

      await test.step(`[${currency}] Open device app`, async () => {
        await addAccountModal.waitForSync();
        const name = await addAccountModal.getFirstAccountName();
        if (typeof name === "string") {
          firstAccountName = name;
        }
        await expect
          .soft(addAccountModal.container)
          .toHaveScreenshot(`${currency}-accounts-list.png`);
      });

      await test.step(`[${currency}] Scan and add accounts`, async () => {
        await addAccountModal.addAccounts();
        await expect.soft(addAccountModal.container).toHaveScreenshot(`${currency}-success.png`);
      });

      await test.step(`[${currency}] Done`, async () => {
        await addAccountModal.done();
        await layout.totalBalance.waitFor({ state: "visible" });
      });

      await test.step(`Navigate to first account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(firstAccountName);
        await accountPage.settingsButton.waitFor({ state: "visible" });
        await expect.soft(page).toHaveScreenshot(`${currency}-firstAccountPage.png`);
      });

      await test.step(`scroll to operations`, async () => {
        await accountPage.scrollToOperations();
        await expect.soft(page).toHaveScreenshot(`${currency}-firstAccountPage-operations.png`);
      });

      await test.step(`Delete current account`, async () => {
        await accountPage.deleteAccount();
        await expect.soft(page).toHaveScreenshot(`${currency}-deleteAccount.png`);
      });

      await test.step(`Delete first account from list`, async () => {
        await accountsPage.deleteFirstAccount();
        await expect.soft(page).toHaveScreenshot(`${currency}-deleteAccountFromAccountsList.png`);
      });
    });
  }
});
