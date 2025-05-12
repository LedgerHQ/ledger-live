import test from "../../fixtures/common";
import { AccountsPage } from "../../page/accounts.page";
import { Layout } from "../../component/layout.component";
import fsPromises from "fs/promises";
import { expect } from "@playwright/test";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.use({ userdata: "accountCosmos" });

test("Rename account", async ({ app, page, userdataFile, electronApp }) => {
  const getUserdata = async () => {
    const jsonFile = await fsPromises.readFile(userdataFile, "utf-8");
    return JSON.parse(jsonFile);
  };
  const layout = new Layout(page);
  await layout.goToAccounts();
  const accountsPage = new AccountsPage(page);
  await accountsPage.navigateToAccountByName("Cosmos 1");

  const newName = "New account name";
  await app.account.expectAccountVisibility("Cosmos 1");
  await app.account.renameAccount(newName);
  await app.account.expectAccountVisibility(newName);
  await sleep(2000);
  await electronApp.close();
  await sleep(2000);
  const userData = await getUserdata();
  expect(userData.data.wallet.accountNames[0][1]).toBe(newName);
});
