import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { getExpectedSeparators } from "@ledgerhq/live-e2e-shared/data/numberFormat";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const exchangeApp: AppInfos = AppInfos.EXCHANGE;
const fromAccount = Account.ETH_1;
const toAccount = Account.BTC_NATIVE_SEGWIT_1;

// Large enough to trigger thousands-grouping in the displayed amounts (B2CQA-4014).
const TEST_AMOUNT = "1234.56";

// The send-amount input always groups with plain whitespace, regardless of language.
const SEND_INPUT_THOUSANDS = " ";

const languageCases = [
  { languageId: "en" as const, label: "English" },
  { languageId: "fr" as const, label: "Français" },
];

test.describe("Swap - amount formatting by language", () => {
  setupEnv(true);

  test.beforeEach(async () => {
    setExchangeDependencies(
      [fromAccount, toAccount].map(acc => ({
        name: acc.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  });

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: exchangeApp,
    cliCommandsOnApp: [
      [fromAccount, toAccount].map(account => ({
        app: account.currency.speculosApp,
        cmd: liveDataWithAddressCommand(account),
      })),
      { scope: "test" },
    ],
  });

  test(
    `Swap amounts are formatted correctly for languages: ${languageCases.map(({ label }) => label).join(", ")}`,
    {
      tag: [...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-4014" },
    },
    async ({ app }) => {
      const swap = new Swap(fromAccount, toAccount, TEST_AMOUNT);
      for (const { languageId, label } of languageCases) {
        // The userdata fixture already boots in English; only switch away from it.
        if (languageId !== "en") {
          await app.mainNavigation.openSettings();
          await app.settings.changeLanguage(label);
        }

        await performSwapUntilQuoteSelectionStep({ app, swap, minAmount: TEST_AMOUNT });
        const separators = getExpectedSeparators(languageId);
        await app.swap.checkAmountsFormatting(separators, {
          decimal: separators.decimal,
          thousands: SEND_INPUT_THOUSANDS,
        });
      }
    },
  );
});
