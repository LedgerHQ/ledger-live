import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";

test.use({ userdata: "adaAccount" });

test(`Open token account`, async ({ page }) => {
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);
  const sendModal = new SendModal(page);

  await test.step(`Open Account`, async () => {
    // TODO: Remove changelog modal
    await layout.goToAccounts();
    await accountsPage.goToAccount("ethereum-1");
  });

  await test.step(`Open token Account`, async () => {
    // TODO: Remove changelog modal
    await layout.goToAccounts();
    await accountsPage.goToAccount("usd-coin");
  });
});
