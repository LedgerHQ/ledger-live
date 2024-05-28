import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { AccountsPage } from "../../page/accounts.page";
import { LayoutComponent } from "../../component/layout.component";
import { LockscreenPage } from "tests/page/lockscreen.page";

test.use({ userdata: "1AccountBTC1AccountETH-encrypted" });

test("accounts are restored on an encrypted app.json", async ({ page }) => {
  const layout = new LayoutComponent(page);
  const lockscreenPage = new LockscreenPage(page);
  await lockscreenPage.login("bad password");
  await layout.inputError.waitFor({ state: "visible" });
  await lockscreenPage.login("foobar");
  await layout.goToAccounts();
  const accountsPage = new AccountsPage(page);
  const count = await accountsPage.countAccounts();
  expect(count).toBe(6);
  await accountsPage.navigateToAccountByName("Ethereum 1");
});
