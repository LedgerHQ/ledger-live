import { test } from "tests/fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { liveDataCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { LWD_WALLET_40_FF_ENABLED } from "tests/utils/featureFlagUtils";

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"] as const;
const account = Account.ARBITRUM_1;

test.describe("Perps poc", () => {
  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.HYPERLIQUID,
    cliCommandsOnApp: [
      [
        {
          app: account.currency.speculosApp,
          cmd: liveDataCommand(account, { currency: account.currency.id }),
        },
      ],
      { scope: "test" },
    ],
    featureFlags: LWD_WALLET_40_FF_ENABLED,
  });

  test(
    "perps poc",
    {
      tag: [...DEVICE_TAGS, "@arbitrum", "@family-evm"],
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
    },
  );
});
