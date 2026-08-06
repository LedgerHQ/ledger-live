import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { performSwapUntilQuoteSelectionStep, setupEnv } from "tests/utils/swapUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import { QuoteCardVariant } from "tests/page/swap.page";

// Regression coverage for the swap-live-app `ptxLumenQuoteCard` migration (old
// `compact-quote-card-provider-name-*` markup vs new `lumen-quote-card-provider-name-*`
// markup): forces each variant explicitly via SwapPage.setQuoteCardVariant() and asserts
// the quote list/details still work AND that the expected markup is actually the one
// rendered, so a future testid rename on either side fails loudly here instead of only
// showing up as unrelated-looking failures across the rest of the swap suite.
//
// TODO(swap-e2e): link an Xray/TMS ticket for this coverage once one exists.

const fromAccount = Account.ETH_1;
const toAccount = TokenAccount.ETH_USDC_1;
const app: AppInfos = AppInfos.ETHEREUM;

for (const variant of ["legacy", "lumen"] as const satisfies readonly QuoteCardVariant[]) {
  test.describe(`Swap - quote card variant (${variant})`, () => {
    setupEnv(true);

    test.beforeEach(async () => {
      const accountPair: string[] = [fromAccount, toAccount].map(acc =>
        acc.currency.speculosApp.name.replace(/ /g, "_"),
      );
      setExchangeDependencies(accountPair.map(name => ({ name })));
    });

    test.use({
      teamOwner: Team.SWAP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap quote card renders correctly with ptxLumenQuoteCard ${variant === "lumen" ? "enabled" : "disabled"}`,
      { tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"] },
      async ({ app }) => {
        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);

        if (!minAmount) {
          throw new Error("Test failed: No quotes retrieved from swap API.");
        }

        const swap = new Swap(fromAccount, toAccount, minAmount);

        await performSwapUntilQuoteSelectionStep(app, swap, minAmount, variant);
        await app.swap.checkActiveQuoteCardVariant(variant);

        const providerList = await app.swap.getProviderList();
        await app.swap.checkQuotesContainerInfos(providerList, toAccount.currency.ticker);
      },
    );
  });
}
