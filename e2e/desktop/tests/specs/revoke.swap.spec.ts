import test from "tests/fixtures/common";
import { TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { setupEnv } from "tests/utils/swapUtils";
import {
  getTokenAllowanceCommand,
  liveDataWithAddressCommand,
} from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { expect } from "@playwright/test";

// NOTE: QAA-615 spike: validate the CLI revoke hook resets allowance to zero in this
// desktop flow.

const fromAccount = TokenAccount.ETH_USDT_1;
const provider = Provider.OKX;
const minAmount = "10";

test.describe("Swap - Revoke token approval", () => {
  setupEnv(true);

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: provider.app,
    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(fromAccount),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Revoke - ${provider.uiName} ${fromAccount.currency.name} allowance returns to zero`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
    },
    async ({ app }) => {
      await app.swap.ensureTokenApproval(fromAccount, provider, minAmount);
      await app.swap.revokeTokenApproval(fromAccount, provider);

      const remaining = await getTokenAllowanceCommand(fromAccount, provider.contractAddress!);
      expect(remaining).toBe("0");
    },
  );
});
