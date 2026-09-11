import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { settleAfterDeviceStatusScreen } from "tests/utils/deviceStatusScreen";

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
        await settleAfterDeviceStatusScreen();

        // The Receive step must now show the private address block, carrying the
        // address derived from the UFVK that was just exported from the device.
        await app.account.clickReceive();
        await app.receive.continue();
        await app.receive.expectPrivateAddressBlockVisible();
        const privateAddress = await app.receive.getPrivateAddressDisplayed();
        await app.receive.expectValidPrivateAddress(privateAddress);
      },
    );
  });
}
