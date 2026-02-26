import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EARN_V2_DESKTOP_FLAGS } from "tests/utils/earnV2Flags";

test.describe("Earn [v2]", () => {
  const account = Account.ETH_1;

  test.use({
    userdata: "skip-onboarding",
    speculosApp: account.currency.speculosApp,
    featureFlags: EARN_V2_DESKTOP_FLAGS,
  });

  test(
    "Earn dashboard loads with v2 flags",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
    },
    async ({ app }) => {
      await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
    },
  );
});
