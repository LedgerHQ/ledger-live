import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { DeviceLabels } from "@ledgerhq/live-e2e-shared/enum/DeviceLabels";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { waitFor } from "@ledgerhq/live-e2e-shared/speculos";
import { buildTags } from "tests/utils/tagsUtils";

const accounts = [
  { account: Account.ZEC_1, xrayTicket: "B2CQA-4300", birthdayHeight: "2026-08-01" },
];

for (const account of accounts) {
  test.describe("Activate private balance", () => {
    test.use({
      teamOwner: Team.BST,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.account.currency.speculosApp,
      cliCommands: [liveDataCommand(account.account)],
      featureFlags: { zcashShielded: { enabled: true } },
    });

    test(
      `[${account.account.currency.testLabel}] - Activate private balance`,
      {
        tag: buildTags({ currencyId: account.account.currency.id }),
        annotation: { type: "TMS", description: account.xrayTicket },
      },
      async ({ app }) => {
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
        await app.privateBalance.close();

        // The UFVK export ends on the device's status screen, which drops any APDU
        // sent while it is up (LIVE-37178). Settle before driving the device again.
        await waitFor(DeviceLabels.ZCASH_IS_READY, 9);

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
}
