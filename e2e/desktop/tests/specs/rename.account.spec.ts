import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { waitForAccountRenamed } from "tests/utils/userdata";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataCommand } from "@ledgerhq/live-common/e2e";

const accounts = [{ account: Account.ATOM_1, xrayTicket: "B2CQA-2996" }];

for (const account of accounts) {
  test.describe("Rename Account", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      cliCommands: [liveDataCommand(account.account)],
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
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app, userdataFile }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.redux.listenToReduxActions();

        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(account.account.accountName);
        await app.account.expectAccountVisibility(account.account.accountName);

        const newName = "New account name";
        await app.account.renameAccount(newName);
        await app.account.expectAccountVisibility(newName);
        await app.redux.waitForReduxAction("UPDATE_ACCOUNT");

        // Wait for the userdata to be persisted to disk with the renamed account
        await waitForAccountRenamed(userdataFile, newName);
      },
    );
  });
}
