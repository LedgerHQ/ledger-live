import { test } from "../fixtures/common";
import fsPromises from "fs/promises";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { CLI } from "../utils/cliUtils";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getUserdata = async (userdataFile: string) => {
  const jsonFile = await fsPromises.readFile(userdataFile, "utf-8");
  return JSON.parse(jsonFile);
};

const accounts = [{ account: Account.ATOM_1, xrayTicket: "B2CQA-2996" }];

for (const account of accounts) {
  test.describe("Rename Account", () => {
    test.use({
      userdata: "skip-onboarding",
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: account.account.currency.id,
            index: account.account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
      speculosApp: account.account.currency.speculosApp,
    });

    test(
      `[${account.account.currency.name}] Rename Account`,
      {
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app, userdataFile, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.account.accountName);
        await app.account.expectAccountVisibility(account.account.accountName);

        const newName = "New account name";
        await app.account.renameAccount(newName);
        await app.account.expectAccountVisibility(newName);
        await sleep(2000);
        await electronApp.close();
        await sleep(2000);
        const userData = await getUserdata(userdataFile);
        expect(userData.data.wallet.accountNames[0][1]).toBe(newName);
      },
    );
  });
}
