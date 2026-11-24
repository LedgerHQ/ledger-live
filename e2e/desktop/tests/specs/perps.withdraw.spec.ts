import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_PERPS_DESKTOP, IS_PERPS_LIVE_APP_STAGING } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { setupEnv } from "tests/utils/swapUtils";

const sourceAccount = Account.HYPERCORE_1;
const receiverAccount = Account.ETH_1;
const withdrawAmount = "10";

const xrayTicket = "B2CQA-6898";

test.describe("Perps withdraw", () => {
  // Remove once the Perps feature flags are on PRD.
  test.skip(!IS_PERPS_LIVE_APP_STAGING, "Perps feature flags are not on PRD yet");

  // Forces broadcast off, overriding any host DISABLE_TRANSACTION_BROADCAST value.
  setupEnv(true);

  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.ETHEREUM,
    cliCommands: [liveDataCommand(receiverAccount), liveDataCommand(sourceAccount)],
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(sourceAccount),
    },
    featureFlags: FF_PERPS_DESKTOP,
  });

  test.beforeEach(async ({ app }) => {
    await app.mainNavigation.openTargetFromMainNavigation("home");
    await app.portfolio.clickPerpsEntryPoint();
    await app.perps.expectFundedAccountBalance();
  });

  test(
    "Withdraw happy path - Hyperliquid to ETH",
    {
      tag: buildTags({ currencyId: sourceAccount.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.perps.clickWithdraw();
      await app.perpsWithdrawDialog.expectWithdrawForm();
      await app.perpsWithdrawDialog.openReceivingAccountPicker();
      await app.modularDialog.selectAsset(receiverAccount.currency);
      await app.modularDialog.selectNetwork(receiverAccount.currency);
      await app.modularDialog.selectAccountRow(receiverAccount);
      await app.perpsWithdrawDialog.expectReceivingAccountSelected(receiverAccount);
      await app.perpsWithdrawDialog.enterAmount(withdrawAmount);
      await app.perpsWithdrawDialog.clickReview();
      await app.perpsWithdrawDialog.expectReview({ sourceAccount, receiverAccount });
      await app.perpsWithdrawDialog.clickWithdraw();
      await app.perpsWithdrawDialog.expectSigning();
      await app.speculos.signTypedMessage();
      await app.perpsTransactionSignedDialog.expectTransactionSigned(receiverAccount);
      await app.perpsTransactionSignedDialog.close();
      await app.perps.expectWithdrawButtonVisible();
    },
  );
});
