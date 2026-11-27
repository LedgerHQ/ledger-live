import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { PerpsProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { FF_PERPS_DESKTOP, IS_PERPS_LIVE_APP_STAGING } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { setupEnv } from "tests/utils/swapUtils";

const receiverAccount = Account.HYPERCORE_1;
const fundingAccount = Account.ETH_1;
const provider = PerpsProvider.SWAPKIT;
const depositAmount = "10";

const xrayTicket = "B2CQA-6895";

test.describe("Perps deposit", () => {
  // Remove once the Perps feature flags are on PRD.
  test.skip(!IS_PERPS_LIVE_APP_STAGING, "Perps feature flags are not on PRD yet");

  // Forces broadcast off, overriding any host DISABLE_TRANSACTION_BROADCAST value.
  setupEnv(true);

  // Must run before the app fixture starts Speculos.
  test.beforeEach(() => {
    setExchangeDependencies([{ name: fundingAccount.currency.speculosApp.name }]);
  });

  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.EXCHANGE,
    cliCommandsOnApp: [
      [
        { app: fundingAccount.currency.speculosApp, cmd: liveDataCommand(fundingAccount) },
        { app: receiverAccount.currency.speculosApp, cmd: liveDataCommand(receiverAccount) },
      ],
      { scope: "test" },
    ],
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(receiverAccount),
    },
    featureFlags: FF_PERPS_DESKTOP,
  });

  test.beforeEach(async ({ app }) => {
    await app.mainNavigation.openTargetFromMainNavigation("home");
    await app.portfolio.clickPerpsEntryPoint();
    await app.perps.expectFundedAccountBalance();
  });

  test(
    "Deposit happy path - ETH to Hyperliquid",
    {
      tag: buildTags({ currencyId: receiverAccount.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.perps.clickDeposit();
      await app.perpsDepositDialog.expectDepositForm();
      await app.perpsDepositDialog.openFundingAccountPicker();
      await app.modularDialog.selectAsset(fundingAccount.currency);
      await app.modularDialog.selectNetwork(fundingAccount.currency);
      await app.modularDialog.selectAccountRow(fundingAccount);
      await app.perpsDepositDialog.expectFundingAccountSelected(fundingAccount);
      await app.perpsDepositDialog.enterAmount(depositAmount);
      await app.perpsDepositDialog.clickReview();
      await app.perpsDepositDialog.expectReview({ fundingAccount, receiverAccount });
      const send = await app.perpsDepositDialog.getReviewSendAmount(fundingAccount);
      await app.perpsDepositDialog.clickDeposit();
      await app.perpsDepositDialog.expectSigning();
      await app.speculos.acceptPerpsDeposit({
        send,
        receiveTicker: receiverAccount.currency.ticker,
        provider,
      });
      await app.perpsTransactionSignedDialog.expectTransactionSigned(receiverAccount);
      await app.perpsTransactionSignedDialog.close();
    },
  );
});
