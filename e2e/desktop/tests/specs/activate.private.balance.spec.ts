import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { buildTags } from "tests/utils/tagsUtils";

const accounts = [
  { account: Account.ZEC_1, xrayTicket: "B2CQA-4300", birthdayHeight: "2026-01-01" },
];

for (const account of accounts) {
  // TODO: Activate when next app is available
  test.describe.skip("Activate private balance", () => {
    test.use({
      teamOwner: Team.BST,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.account.currency.speculosApp,
      cliCommands: [liveDataCommand(account.account)],
      featureFlags: {
        zcashShielded: {
          enabled: true,
        },
      },
    });

    test(
      `[${account.account.currency.testLabel}] - Activate private balance`,
      {
        tag: buildTags({ currencyId: account.account.currency.id }),
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(account.account.accountName);
        await app.account.expectAccountVisibility(account.account.accountName);
        await app.account.clickShowBalance();
        await app.privateBalance.expectModalVisibility();
        await app.privateBalance.editBirthdayHeight(account.birthdayHeight);
        await app.privateBalance.clickContinue();
        await app.privateBalance.clickContinue();
        await app.speculos.exportUfvk(account.account);
        await app.privateBalance.confirmUfvkExportedFromDevice();
      },
    );
  });
}
