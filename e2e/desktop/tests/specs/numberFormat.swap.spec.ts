import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { addTmsLink, getDescription } from "tests/utils/allureUtils";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { expectFormattedAmount } from "tests/utils/amountUtils";
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

  for (const { languageId, label } of languageCases) {
    test(
      `Swap amounts are formatted correctly for language: ${label}`,
      {
        tag: [...DEVICE_TAGS],
        annotation: { type: "TMS", description: "B2CQA-4014" },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        // The userdata fixture already boots in English; only switch away from it.
        if (languageId !== "en") {
          await app.mainNavigation.openSettings();
          await app.settings.changeLanguage(label);
        }

        const swap = new Swap(fromAccount, toAccount, TEST_AMOUNT);
        await performSwapUntilQuoteSelectionStep(app, swap, TEST_AMOUNT);

        const separators = getExpectedSeparators(languageId);

        const sentAmount = await app.swap.getAmountToSend();
        await expectFormattedAmount(
          sentAmount,
          { decimal: separators.decimal, thousands: SEND_INPUT_THOUSANDS },
          "send amount input",
        );

        const countervalue = await app.swap.getSendCountervalueText();
        await expectFormattedAmount(countervalue, separators, "send amount countervalue");

        const receivedAmount = await app.swap.getAmountToReceive();
        await expectFormattedAmount(receivedAmount, separators, "receive amount");

        // Provider list is sorted best-first, so the first entry is the "Best Offer" card.
        const providerList = await app.swap.getProviderList();
        const bestQuoteProvider = providerList[0];
        const { amount, fiatAmount } = await app.swap.getQuoteAmountTexts(bestQuoteProvider);
        await expectFormattedAmount(amount, separators, `best quote (${bestQuoteProvider}) amount`);
        await expectFormattedAmount(
          fiatAmount,
          separators,
          `best quote (${bestQuoteProvider}) fiat amount`,
        );
      },
    );
  }
});
