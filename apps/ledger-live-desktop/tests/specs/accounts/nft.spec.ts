import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";

test.use({ userdata: "adaAccount" });

test(`Open nft drawer`, async ({ page }) => {
  const layout = new Layout(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);

  await test.step(`Open account`, async () => {
    await layout.goToAccounts();
    await accountsPage.goToAccount("ethereum-1");
  });

  await test.step(`Open nft collection`, async () => {
    await accountPage.goToNftCollection("0x495f947276749Ce646f68AC8c248420045cb7b5e");
  });

  await test.step(`nft collection list view`, async () => {
    await expect.soft(page).toHaveScreenshot(`nft-listview-success.png`);
  });

  await test.step(`open nft drawer`, async () => {
    await accountPage.goToNftCollection("ID: 845158187637...9010886680577");
  });

  await test.step(`display nft drawer`, async () => {
    await expect.soft(page).toHaveScreenshot(`nft-drawer.png`);
  });
});
