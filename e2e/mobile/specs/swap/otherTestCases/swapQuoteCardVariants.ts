import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  swapFlagPresetQuoteCard,
  type SwapFlagPreset,
} from "@ledgerhq/live-e2e-shared/data/swapLiveAppFlags";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { performSwapUntilQuoteSelectionStep } from "@e2e/utils/swapUtils";
import { beforeAllFunctionSwap } from "@e2e/specs/swap/swap.setup";

// One case per observable variant: the design variants only swap CSS classes. The disabled
// variant runs first, so a teardown that cannot reach the live app leaves the production
// variant behind.
const presets: SwapFlagPreset[] = ["quoteCardCompact", "quoteCardProviderCta", "quoteCardShortCta"];

export function runSwapQuoteCardVariantsTest(
  fromAccount: Account,
  toAccount: Account,
  tags: string[],
) {
  describe("Swap - quote card feature flag variants", () => {
    beforeAll(async () => {
      await app.speculos.setExchangeDependencies(fromAccount, toAccount);
      await beforeAllFunctionSwap({
        userdata: "skip-onboarding",
        speculosApp: AppInfos.EXCHANGE,
        cliCommandsOnApp: [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
      });
    });

    afterEach(async () => {
      await app.swapLiveApp.clearFlagOverrides();
    });

    setTeamOwner(Team.SWAP);
    tags.forEach(tag => $Tag(tag));

    for (const preset of presets) {
      const { markup, ctaCopy } = swapFlagPresetQuoteCard[preset];

      it(`[${preset}] Quote card shows the ${markup} markup and the ${ctaCopy} CTA copy`, async () => {
        await app.swapLiveApp.applyFlagPreset(preset);

        const minAmount = await app.swapLiveApp.getMinimumAmount(fromAccount, toAccount);
        await performSwapUntilQuoteSelectionStep(fromAccount, toAccount, minAmount);
        await app.swapLiveApp.checkQuotes();
        await app.swapLiveApp.checkQuoteCardMarkup(markup);

        const providerList = await app.swapLiveApp.getProviderList();
        await app.swapLiveApp.checkQuoteCardCta(providerList[0]);
      });
    }
  });
}
