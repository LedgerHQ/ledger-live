import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

const account = Account.ZEC_1;
const xrayTicket = "B2CQA-4300";
const birthdayHeight = "2026-08-01";

test.describe("Activate private balance", () => {
  test.use({
    teamOwner: Team.BST,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
    featureFlags: { zcashShielded: { enabled: true } },
  });

  test(
    `[${account.currency.testLabel}] - Activate private balance`,
    {
      tag: buildTags({ currencyId: account.currency.id }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.clickShowBalance();
      await app.privateBalance.expectModalVisibility();
      await app.privateBalance.editBirthdayHeight(birthdayHeight);
      await app.privateBalance.clickContinue();
      await app.privateBalance.clickContinue();
      await app.speculos.exportUfvk(account);
      await app.privateBalance.confirmUfvkExportedFromDevice();
      await app.privateBalance.close();
      await app.speculos.waitForAppReady(account.currency.speculosApp);

      // The Receive step must now show the private address block, carrying the
      // address derived from the UFVK that was just exported from the device.
      await app.account.clickReceive();
      await app.receive.continue();
      await app.receive.expectPrivateAddressBlockVisible();
      // Compare against the address the device derives for the shared QA seed,
      // not against whatever the UI just rendered: this is what makes the spec
      // assert the export-to-receive linkage rather than its own output.
      await app.receive.expectValidPrivateAddress(Addresses.ZEC_1_SHIELDED_ADDRESS);
    },
  );
});
