import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { getUserdata } from "tests/utils/userdata";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";

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

    const family = getFamilyByCurrencyId(account.account.currency.id);

    test(
      `[${account.account.currency.name}] Rename Account`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${account.account.currency.id}`,
          ...(family && family !== account.account.currency.id ? [`@${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app, userdataFile, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.redux.listenToReduxActions();

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.account.accountName);
        await app.account.expectAccountVisibility(account.account.accountName);

        const newName = "New account name";
        await app.account.renameAccount(newName);
        await app.account.expectAccountVisibility(newName);
        await app.redux.waitForReduxAction("UPDATE_ACCOUNT");
        await electronApp.close();
        const userData = await getUserdata(userdataFile);
        expect(userData.data.wallet.accountsData.accountNames[0][1]).toBe(newName);
      },
    );
  });
}
