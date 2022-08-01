import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "tests/models/AccountsPage";
import { AccountPage } from "tests/models/AccountPage";

//test.use({ userdata: "skip-onboarding" });
test.use({ userdata: "adaAccount" })

test(`ADA send`, async ({ page }) => {
  const deviceAction = new DeviceAction(page);
  const accountsPage = new AccountsPage(page);
  const layout = new Layout(page);
  const accountPage = new AccountPage(page);

  await test.step(`Open Account`, async () => {
    await layout.goToAccounts();
    await accountsPage.clickAccountTile();
    await accountPage.clickBtnSend();
  });

  //recipient adresse: addr1qxpah604p4hgnvqd4ql5azz9vkzzptvg7u2wjvupk3x59h63qunfksfflaezaqfwysefz7cs2pd7gcd4jqc77hqyu6ms5lkec9
});