import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
import { swapSetup } from "@e2e/bridge/server";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { performSwapUntilQuoteSelectionStep } from "@e2e/utils/swapUtils";
import { expectFormattedAmount } from "@e2e/utils/amountUtils";
import {
  getExpectedSeparators,
  buildFormattedAmountPattern,
  type FormattedNumberLanguage,
} from "@ledgerhq/live-e2e-shared/data/numberFormat";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const fromAccount = Account.ETH_1;
const toAccount = Account.BTC_NATIVE_SEGWIT_1;

// Immediately overridden by tapping "Max" below (performSwapUntilQuoteSelectionStep requires
// some amount to type first). A fixed amount like desktop's isn't safe here: it can exceed the
// emulator's real balance or a provider's limit and leave "Get quotes" permanently disabled.
const PLACEHOLDER_AMOUNT = "0.001";

// The send-amount input always groups with plain whitespace, regardless of language.
const SEND_INPUT_THOUSANDS = " ";

const languageCases: { languageId: FormattedNumberLanguage; label: string }[] = [
  { languageId: "en", label: "English" },
  { languageId: "fr", label: "Français" },
];

export function runSwapNumberFormatLocaleTest(tmsLinks: string[], tags: string[]) {
  describe("Swap - amount formatting by language", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: AppInfos.EXCHANGE,
        featureFlags: {
          ptxSwapLiveAppMobile: {
            enabled: true,
            params: {
              manifest_id:
                process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
            },
          },
        },
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
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(Team.SWAP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    for (const { languageId, label } of languageCases) {
      it(`Swap amounts are formatted correctly for language: ${label}`, async () => {
        // Previous iteration may have left the app inside the swap webview.
        await app.mainNavigation.openPortfolioViaDeeplink();

        // The userdata fixture already boots in English; only switch away from it.
        if (languageId !== "en") {
          await app.mainNavigation.navigateToSettings();
          await app.settings.navigateToGeneralSettings();
          await app.settingsGeneral.navigateToLanguageSelect();
          await app.settingsGeneral.selectLanguage(label);
        }

        await swapSetup();
        await app.swap.openViaDeeplink();
        await app.swapLiveApp.expectSwapLiveApp();

        const separators = getExpectedSeparators(languageId);
        const formattedAmountPattern = buildFormattedAmountPattern(separators);

        // continueToQuotes=false: "Max" (below) fills a real, balance-safe amount instead of a
        // guessed one, and the wait is locale-aware instead of the English-only
        // `floatNumberRegex` the skipped step would have used.
        await performSwapUntilQuoteSelectionStep(fromAccount, toAccount, PLACEHOLDER_AMOUNT, false);
        await app.swapLiveApp.clickSwapMax(formattedAmountPattern, 20000);
        await app.swapLiveApp.tapGetQuotesButton();
        await app.swapLiveApp.waitForQuotes();

        const sentAmount = await app.swapLiveApp.getAmountToSend();
        expectFormattedAmount(
          sentAmount,
          { decimal: separators.decimal, thousands: SEND_INPUT_THOUSANDS },
          "send amount input",
        );

        const countervalue = await app.swapLiveApp.getSendCountervalueText();
        expectFormattedAmount(countervalue, separators, "send amount countervalue");

        const receivedAmount = await app.swapLiveApp.getAmountToReceive();
        expectFormattedAmount(receivedAmount, separators, "receive amount");

        // Provider list is sorted best-first, so the first entry is the "Best Offer" card.
        const providerList = await app.swapLiveApp.getProviderList();
        const bestQuoteProvider = providerList[0];
        const { amount, fiatAmount } = await app.swapLiveApp.getQuoteCardRawText(bestQuoteProvider);
        expectFormattedAmount(amount, separators, `best quote (${bestQuoteProvider}) amount`);
        expectFormattedAmount(
          fiatAmount,
          separators,
          `best quote (${bestQuoteProvider}) fiat amount`,
        );
      });
    }
  });
}
