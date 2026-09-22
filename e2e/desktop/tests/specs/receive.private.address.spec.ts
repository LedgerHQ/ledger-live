import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { liveDataCommand, seedZcashPrivateInfo } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

// Covers the returning user: an account whose private balance is already
// enabled opens Receive in a fresh session. `activate.private.balance.spec.ts`
// covers the other half -- enabling it and receiving in the same session.
const account = Account.ZEC_1;
const xrayTicket = "B2CQA-6606";

test.describe("Receive private address", () => {
  test.use({
    teamOwner: Team.BST,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [
      liveDataCommand(account, {
        postSeedHook: seedZcashPrivateInfo(account, Addresses.ZEC_1_SHIELDED_ADDRESS),
      }),
    ],
    featureFlags: { zcashShielded: { enabled: true } },
  });

  test(
    `[${account.currency.testLabel}] - Verify private address displayed`,
    {
      tag: buildTags({ currencyId: account.currency.id }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.clickReceive();
      await app.receive.continue();
      await app.receive.expectPrivateAddressBlockVisible();
      await app.receive.expectValidPrivateAddress(Addresses.ZEC_1_SHIELDED_ADDRESS);
    },
  );
});
