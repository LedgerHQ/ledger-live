import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import type { PartialFeatures } from "@shared/feature-flags";
import { mockEarnPositions, mockEarnPositionsFailure } from "tests/utils/earnPositionsMock";
import {
  FF_ACCOUNT_DETAIL_DISABLED,
  FF_ACCOUNT_DETAIL_ENABLED,
  FF_STAKE_POSITION_ACCOUNT_PAGE,
} from "tests/utils/featureFlagUtils";
import { openAccountWithActiveSolanaStake } from "tests/utils/stakePositionUtils";
import { buildTags } from "tests/utils/tagsUtils";

// The QA seed must keep an active stake on this account: without one the tests fail, never skip.
// They stop on the device step, whose Solana screens have no device labels yet.
const account = Account.SOL_2;
const tags = buildTags({ currencyId: account.currency.id });

function useStakePositionFixtures(accountPageFlags: PartialFeatures) {
  test.use({
    // Without a seen device, confirming the exit opens the Buy device flow instead of the device.
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
    featureFlags: { ...FF_STAKE_POSITION_ACCOUNT_PAGE, ...accountPageFlags },
  });
}

test.describe("Stake position", () => {
  test.use({ teamOwner: Team.EARN, env: { DISABLE_TRANSACTION_BROADCAST: "1" } });

  test.describe("Account page", () => {
    useStakePositionFixtures(FF_ACCOUNT_DETAIL_DISABLED);

    test(
      `[${account.currency.testLabel}] - View stake position details - account page`,
      { tag: tags },
      async ({ app }) => {
        const position = await openAccountWithActiveSolanaStake(app, account);
        const figures = await mockEarnPositions(app, position);
        await app.account.openStakePositionDetails(position);
        await app.stakePositionDialog.expectDetailsVisible(figures);
      },
    );

    test(
      `[${account.currency.testLabel}] - Deactivate stake position up to the device - account page`,
      { tag: tags },
      async ({ app }) => {
        const position = await openAccountWithActiveSolanaStake(app, account);
        await mockEarnPositions(app, position);
        await app.account.openStakePositionDetails(position);
        await app.stakePositionDialog.clickDeactivate();
        await app.stakePositionDialog.confirmDeactivation();
        await app.stakePositionDialog.expectDeviceStep();
      },
    );

    test(
      `[${account.currency.testLabel}] - View stake position details after a load error - account page`,
      { tag: tags },
      async ({ app }) => {
        const position = await openAccountWithActiveSolanaStake(app, account);
        const earnBackend = await mockEarnPositionsFailure(app, position);
        await app.account.openStakePositionDetails(position);
        await app.stakePositionDialog.expectErrorState();
        earnBackend.recover();
        await app.stakePositionDialog.clickTryAgain();
        await app.stakePositionDialog.expectDetailsVisible(earnBackend.figures);
      },
    );
  });

  test.describe("Account detail page", () => {
    useStakePositionFixtures(FF_ACCOUNT_DETAIL_ENABLED);

    test(
      `[${account.currency.testLabel}] - View stake position details - account detail page`,
      { tag: tags },
      async ({ app }) => {
        const position = await openAccountWithActiveSolanaStake(app, account);
        const figures = await mockEarnPositions(app, position);
        await app.account.openStakePositionDetails(position);
        await app.stakePositionDialog.expectDetailsVisible(figures);
      },
    );
  });
});
