import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  quoteCardVariantByPreset,
  type SwapFlagPreset,
} from "@ledgerhq/live-e2e-shared/data/swapLiveAppFlags";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const app: AppInfos = AppInfos.EXCHANGE;
const accountToDebit = Account.ETH_1;
const accountToCredit = Account.BTC_NATIVE_SEGWIT_1;

// One case per value the A/B test serves. Disabled runs first, so a failed teardown
// leaves the production state behind.
const presets: SwapFlagPreset[] = ["lumenQuoteCardDisabled", "lumenQuoteCardEnabled"];

test.describe("Swap - quote card feature flag variants", () => {
  setupEnv(true);

  test.beforeEach(async () => {
    setExchangeDependencies(
      [accountToDebit, accountToCredit].map(account => ({
        name: account.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  });

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,
    cliCommandsOnApp: [
      [
        {
          app: accountToDebit.currency.speculosApp,
          cmd: liveDataWithAddressCommand(accountToDebit),
        },
        {
          app: accountToCredit.currency.speculosApp,
          cmd: liveDataWithAddressCommand(accountToCredit),
        },
      ],
      { scope: "test" },
    ],
  });

  test.afterEach(async ({ app }) => {
    await app.swap.clearFlagOverrides();
  });

  for (const preset of presets) {
    const variant = quoteCardVariantByPreset[preset];

    test(
      `[${preset}] Quote card shows the ${variant} card and the provider CTA copy`,
      {
        tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      },
      async ({ app }) => {
        // Open the live app first: the override lives in its own storage.
        await app.swap.goAndWaitForSwapToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("swap"),
        );
        await app.swap.applyFlagPreset(preset);

        const amount = await app.swap.getMinimumAmount(accountToDebit, accountToCredit);
        await performSwapUntilQuoteSelectionStep(
          app,
          new Swap(accountToDebit, accountToCredit, amount),
          amount,
        );
        await app.swap.checkQuotes();
        await app.swap.checkQuoteCardVariant(variant);

        const providerList = await app.swap.getProviderList();
        await app.swap.checkQuoteCardCta(providerList[0]);
      },
    );
  }
});
