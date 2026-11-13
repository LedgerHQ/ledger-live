import { Step } from "jest-allure2-reporter/api";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { getMinimumSwapAmount } from "@ledgerhq/live-e2e-shared/swap";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { byId } from "@e2e/helpers/elements/native";
import { removeWebviewStorageItems, webByCss, webById } from "@e2e/helpers/elements/web";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { expectWithinTolerance } from "@e2e/utils/amountUtils";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";
import { floatNumberRegex } from "@ledgerhq/live-e2e-shared/data/regexes";
import {
  COUNTDOWN_STABLE_TIMEOUT,
  PROVIDER_LIST_SETTLE_TIMEOUT,
  QUOTES_FETCH_TIMEOUT,
} from "@e2e/utils/constants";

// Uniswap's Permit2 "Approve token access" step can take 1-5 min to confirm on-chain
// before the sign-permit button (Step 2) appears (the app shows a "1-5 mins" estimate).
const APPROVAL_PROCESSING_TIMEOUT = TIMEOUT.xxxxlarge;

// Provider UI names (e.g. "Swaps.xyz", "LI.FI") can contain regex metacharacters. Escape them
// before embedding in a RegExp so they match literally instead of altering the pattern.
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Net value of a quote as shown on screen: amount received minus network fees (both in fiat).
const quoteNetValue = (quote: { rate: number; fees: number }) => quote.rate - quote.fees;

export default class SwapLiveAppPage {
  // `ptxLumenQuoteCard` is on for everyone with `ptxLumenQuoteSameCtaCopy`: lumen card, old CTA copy.
  private static readonly PROVIDER_NAME_PREFIX = "lumen-quote-card-provider-name-";
  private static readonly PROVIDER_NAME_CSS = `[data-testid^='${SwapLiveAppPage.PROVIDER_NAME_PREFIX}']`;

  private readonly showDetailsLinkId = "show-details-link";
  private readonly executeSwapButtonId = "execute-button";
  private readonly incompatibilityBannerPartnerId = "incompatibility-banner-partner";

  private readonly mainContainer = webByCss("main");
  private readonly fromSelector = webById("from-account-coin-selector");
  private readonly fromAmountInput = webById("from-account-amount-input");
  private readonly toSelector = webById("to-account-coin-selector");
  private readonly toAmountInput = webById("to-account-amount-input");
  private readonly getQuotesButton = webById("mobile-get-quotes-button");
  private readonly quotesButtonDisabled = webById("mobile-get-quotes-button-disabled");
  private readonly bestValueInfoIcon = webById("best-value-info-icon");
  private readonly quotesCountDown = webById("quotes-countdown");
  private readonly executeSwapButtonStepApproval = webById("execute-swap-button-step-approval");
  private readonly fromAccountError = webById("from-account-error");
  private readonly showDetailsLink = webById(this.showDetailsLinkId);
  /** With quotes listed, the link is repeated in the fixed footer: tap that one. */
  private readonly showDetailsLinkInFooter = webByCss(
    `.fixed [data-testid="${this.showDetailsLinkId}"]`,
  );
  private readonly quotesContainerErrorIcon = webById("quotes-container-error-icon");
  private readonly insufficientFundsBuyButton = webById("insufficient-funds-buy-button");
  private readonly fromAccountAccountNameTag = webById("from-account-account-name-tag");
  private readonly fromAccountBalance = webById("from-account-balance");
  private readonly toAccountAccountNameTag = webById("to-account-account-name-tag");
  private readonly fromAccountAmountInactive = webById("from-account-amount-inactive");
  private readonly swapMaxToggle = webById("from-account-max-toggle");
  private readonly revokeApprovalButton = webById("revoke-approval-button");
  private readonly giveApprovalButton = webById("give-approval-button");
  private readonly signPermitButton = webById("sign-permit-button");
  private readonly deviceActionErrorDescription = byId("error-description-deviceAction");
  private readonly liveAppTitle = byId("live-app-title");

  private readonly lnsUnsupportedBannerPattern =
    /Ledger Nano S[\s\S]*(not supported|unsupported|does not support|not compatible)/i;

  private readonly baseProviderCssSelector = (provider: string) =>
    `[data-testid^="quote-container-${SwapProvider.getNameByUiName(provider)}"]`;
  private readonly providerExecuteButtonCss = (provider: string) =>
    `${this.baseProviderCssSelector(provider)} [data-testid="${this.executeSwapButtonId}"]`;
  private readonly providerQuoteContainerSelector = (provider: string) =>
    `${this.baseProviderCssSelector(
      provider,
    )}[data-testid$="-fixed"], ${this.baseProviderCssSelector(provider)}[data-testid$="-float"]`;
  private readonly incompatibilityBannerPartner = (provider: string) =>
    webByCss(
      `${this.baseProviderCssSelector(provider)} [data-testid="${this.incompatibilityBannerPartnerId}"]`,
    );
  /** A part of the provider's quote card, by the end of its testid, e.g. `-amount-label`. */
  private readonly quoteCardPartCss = (provider: string, suffix: string) =>
    `${this.baseProviderCssSelector(provider)}[data-testid$="${suffix}"]`;

  private readonly providerExecuteButton = (provider: string) =>
    webByCss(this.providerExecuteButtonCss(provider));
  private readonly quoteCardPart = (provider: string, suffix: string) =>
    webByCss(this.quoteCardPartCss(provider, suffix));
  // Prefix match: the testid ends with the quote's provider id, which can extend the e2e name
  // (1inch renders as `oneinchfusion` when its Fusion quote wins).
  private readonly providerNameButton = (providerName: string) =>
    webByCss(`[data-testid^='${SwapLiveAppPage.PROVIDER_NAME_PREFIX}${providerName}']`);

  @Step("Expect swap live app page")
  async expectSwapLiveApp() {
    await this.fromSelector.waitVisible();
    await this.fromSelector.expectExist();
    await this.toSelector.expectExist();
    await this.quotesButtonDisabled.expectExist();
  }

  @Step("Expect swap live app form")
  async expectSwapLiveAppForm() {
    await this.fromSelector.waitVisible();
    await this.fromSelector.expectExist();
    await this.toSelector.expectExist();
  }

  @Step("Check if the from currency is already selected")
  async getFromCurrencyTexts() {
    return await this.fromSelector.getText();
  }

  @Step("Check if the to currency is already selected")
  async getToCurrencyTexts() {
    return await this.toSelector.getText();
  }

  @Step("Tap from currency")
  async tapFromCurrency() {
    await this.fromSelector.tap();
  }

  @Step("Verify currency {{{0}}} is selected")
  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    const selector = isFromCurrency ? this.fromSelector : this.toSelector;
    await selector.expectText(ticker, { containing: true });
  }

  @Step("Tap to currency")
  async tapToCurrency() {
    await this.toSelector.tap();
  }

  @Step("Input amount {{{0}}}")
  async inputAmount(amount: string) {
    await this.fromAmountInput.replaceText(amount);
  }

  @Step("Tap get quotes button")
  async tapGetQuotesButton() {
    await this.toAmountInput.getValue();
    await this.getQuotesButton.tap();
  }

  @Step("Verify get quotes CTA is hidden")
  async expectQuotesButtonNotVisible() {
    await this.getQuotesButton.expectNotExist();
    await this.quotesButtonDisabled.expectNotExist();
  }

  @Step("Wait for quotes")
  async waitForQuotes() {
    await this.bestValueInfoIcon.waitVisible(QUOTES_FETCH_TIMEOUT);
    await this.waitForQuotesStable();
  }

  @Step("verify quotes are displayed")
  async checkQuotes() {
    await this.bestValueInfoIcon.expectExist();
  }

  @Step("Select available provider")
  async selectExchange() {
    const providersList = (await this.getProviderList()).filter(
      name => name !== SwapProvider.LIFI.uiName,
    );

    for (const providerName of providersList) {
      const provider = SwapProvider.getByUiName(providerName);
      if (provider && !provider.kyc && !provider.app) {
        await this.tapProviderName(provider.name);

        return provider;
      }
    }
    throw new Error("No single-app exchange providers found");
  }

  private async tapProviderName(providerName: string) {
    await this.providerNameButton(providerName).tap();
  }

  @Step("Wait for quotes countdown to be stable")
  async waitForQuotesStable(timeout: number = COUNTDOWN_STABLE_TIMEOUT) {
    await retryUntilTimeout(async () => {
      const countdownText = await this.quotesCountDown.getText();
      const currentSeconds = Number.parseInt(countdownText.replaceAll(/\D/g, ""), 10);

      if (Number.isNaN(currentSeconds)) {
        throw new TypeError(`Could not parse countdown value: ${countdownText}`);
      }
      if (currentSeconds < 2 || currentSeconds > 19) {
        throw new Error(`Countdown is ${currentSeconds}s, needs to be between 2 and 19`);
      }

      return currentSeconds;
    }, timeout);
  }

  @Step("Tap execute swap button {{{0}}}")
  async tapExecuteSwap(provider: string) {
    await this.providerExecuteButton(provider).tap();
  }

  @Step("Expect execute swap button on step approval")
  async expectExecuteSwapOnStepApproval({
    isTokenApproval = false,
  }: { isTokenApproval?: boolean } = {}) {
    await this.executeSwapButtonStepApproval.waitVisible(
      isTokenApproval ? APPROVAL_PROCESSING_TIMEOUT : TIMEOUT.xxlarge,
    );
    await this.executeSwapButtonStepApproval.expectExist();
  }

  @Step("Tap execute swap button on step approval")
  async tapExecuteSwapOnStepApproval() {
    await this.executeSwapButtonStepApproval.waitVisible(APPROVAL_PROCESSING_TIMEOUT);
    await this.executeSwapButtonStepApproval.waitEnabled();
    await this.executeSwapButtonStepApproval.tap();
  }

  @Step("Get minimum amount for swap")
  async getMinimumAmount(fromAccount: Account, toAccount: Account, providersWhitelist?: string[]) {
    return (
      (await getMinimumSwapAmount(fromAccount, toAccount, providersWhitelist))?.toString() ?? ""
    );
  }

  @Step("Get provider list")
  async getProviderList() {
    await this.bestValueInfoIcon.expectExist();
    await this.quotesCountDown.expectExist();

    let previousCount = -1;

    const providerList = await retryUntilTimeout(
      async () => {
        const names = await this.mainContainer.getChildTexts(SwapLiveAppPage.PROVIDER_NAME_CSS);

        if (names.length === 0) {
          throw new Error("No quote providers were returned");
        }
        if (names.length !== previousCount) {
          previousCount = names.length;
          throw new Error(
            `Quote list still growing (${names.length} cards); waiting for it to settle`,
          );
        }

        return names;
      },
      PROVIDER_LIST_SETTLE_TIMEOUT,
      INTERVAL.medium,
    );

    return providerList;
  }

  @Step("Check error message: {{{0}}}")
  async checkErrorMessage(errorMessage: string) {
    await this.deviceActionErrorDescription.expectText(errorMessage, { containing: true });
  }

  @Step("Check first quote container infos {{{0}}}")
  async checkFirstQuoteContainerInfos(providerList: string[]) {
    const uiName = providerList[0];
    const provider: string = SwapProvider.getNameByUiName(uiName);
    const amountLabel = this.quoteCardPart(uiName, "-amount-label");
    await amountLabel.waitVisible();
    await amountLabel.tap();

    await amountLabel.expectExist();
    await this.quoteCardPart(uiName, "-fiatAmount-label").expectExist();
    await this.quoteCardPart(uiName, "-networkFees-heading").expectExist();
    await this.quoteCardPart(uiName, "extraFeesContainer").expectExist();
    await this.quoteCardPart(uiName, "-rate-infoIcon").expectExist();

    if (
      provider === SwapProvider.ONE_INCH.name ||
      provider === SwapProvider.VELORA.name ||
      provider === SwapProvider.UNISWAP.name ||
      provider === SwapProvider.LIFI.name
    ) {
      await this.quoteCardPart(uiName, "-slippage-infoIcon").expectExist();
    }
    await this.checkQuoteCardCtaLabel(uiName);
  }

  // Only asserts the CTA testid is present and usable; ignores its label so an
  // A/B-tested label cannot fail callers that only need the button to exist.
  @Step("Check exchange CTA presence: {{{0}}}")
  async checkQuoteCardCtaPresence(provider: string): Promise<void> {
    if (!SwapProvider.getNameByUiName(provider)) {
      throw new Error(`Unknown provider UI name: "${provider}"`);
    }
    await this.providerExecuteButton(provider).waitVisible();
    await this.providerExecuteButton(provider).expectExist();
  }

  // approvalRequired must reflect real allowance state — see isTokenApprovalExpected
  // in swapUtils.ts, rather than guessing it here.
  @Step("Check exchange CTA text: {{{0}}}")
  async checkQuoteCardCtaLabel(provider: string, approvalRequired = false): Promise<void> {
    await this.checkQuoteCardCtaPresence(provider);
    const ctaVerb = approvalRequired ? "Approve spending" : "Swap";
    await this.providerExecuteButton(provider).expectText(`${ctaVerb} with ${provider}`);
  }

  @Step('Check "Best Offer" corresponds to the best quote')
  async checkBestOffer(providerList: string[]) {
    if (providerList.length === 0) {
      throw new Error("checkBestOffer: expected a non-empty provider list");
    }
    // net = cent-rounded amount - cent-rounded fees, so each net carries ±0.01; two providers'
    // nets can therefore differ by up to 0.02 from rounding alone.
    const NET_ROUNDING_TOLERANCE = 0.02;

    await retryUntilTimeout(async () => {
      const quotes = [];
      for (const provider of providerList) {
        quotes.push(await this.getProviderQuote(provider));
      }

      const firstQuote = quotes[0];
      const bestNetValue = Math.max(...quotes.map(quoteNetValue));
      expectWithinTolerance({
        actual: quoteNetValue(firstQuote),
        expected: bestNetValue,
        tolerance: NET_ROUNDING_TOLERANCE,
      });
    });
  }

  async getProviderQuote(provider: string) {
    const quoteText =
      (await this.mainContainer.getChildTexts(this.providerQuoteContainerSelector(provider)))[0] ??
      "";
    const networkFeesIndex = quoteText.search(/Network Fees/i);
    const feesMatch =
      networkFeesIndex >= 0 ? /\$\s*(\d[\d,.]*)/.exec(quoteText.slice(networkFeesIndex)) : null;
    const usdAmountRegex = /\$\s*(\d[\d,.]*)/g;
    const usdAmounts = [];
    let usdAmountMatch: RegExpExecArray | null;

    while ((usdAmountMatch = usdAmountRegex.exec(quoteText)) !== null) {
      usdAmounts.push(usdAmountMatch[1]);
    }

    if (!feesMatch || usdAmounts.length === 0) {
      throw new Error(`No parsable quote found for provider ${provider}`);
    }

    const parseAmount = (amount: string) => Number.parseFloat(amount.replaceAll(",", ""));

    return {
      provider,
      fees: parseAmount(feesMatch[1]),
      rate: parseAmount(usdAmounts.at(-1) ?? ""),
    };
  }

  @Step("Verify swap amount error message match: {{{0}}}")
  async verifySwapAmountErrorMessageIsCorrect(expectedMessage: string | RegExp) {
    if (typeof expectedMessage === "string") {
      await this.fromAccountError.expectText(expectedMessage, { containing: true });
    } else {
      await this.fromAccountError.expectTextMatching(expectedMessage);
    }
    await this.expectQuotesButtonNotVisible();
  }

  @Step("Verify swap CTA banner displayed")
  async checkCtaBanner(quotesVisible: boolean) {
    const showDetailsLink = quotesVisible ? this.showDetailsLinkInFooter : this.showDetailsLink;
    await showDetailsLink.tap();
    await this.quotesContainerErrorIcon.waitVisible();
    await this.insufficientFundsBuyButton.expectExist();
  }

  @Step("Click on swap max {{{0}}}")
  async clickSwapMax(pattern: RegExp = floatNumberRegex, timeout?: number) {
    await this.swapMaxToggle.tap();
    await this.waitForAmountToReceive(pattern, timeout);
  }

  @Step("Wait for the receive amount to match {{{0}}}")
  async waitForAmountToReceive(pattern: RegExp, timeout = TIMEOUT.medium) {
    await this.toAmountInput.waitTextMatching(pattern, timeout);
  }

  @Step("Retrieve send currency amount value")
  async getAmountToSend() {
    return await this.fromAmountInput.getValue();
  }

  @Step("Retrieve receive currency amount value")
  async getAmountToReceive() {
    return await this.toAmountInput.getText();
  }

  @Step("Retrieve send currency countervalue text")
  async getSendCountervalueText() {
    return await this.fromAccountAmountInactive.getText();
  }

  @Step("Get quote card raw amount texts for {{{0}}}")
  async getQuoteCardRawText(provider: string) {
    const amount =
      (
        await this.mainContainer.getChildTexts(this.quoteCardPartCss(provider, "-amount-label"))
      )[0] ?? "";
    const fiatAmount =
      (
        await this.mainContainer.getChildTexts(this.quoteCardPartCss(provider, "-fiatAmount-label"))
      )[0] ?? "";
    return { amount, fiatAmount };
  }

  @Step("Check currency to swap from is {{{0}}} with amount {{{1}}}")
  async checkAssetFrom(currency: string, amount: string) {
    await this.fromSelector.expectText(currency, { containing: true });
    await this.fromAmountInput.expectValue(amount);
  }

  @Step("Check currency to swap from contains {{{0}}}")
  async checkAssetFromContains(expectedAssetText: string) {
    await this.fromSelector.expectText(expectedAssetText, { containing: true });
  }

  @Step("Check from-account balance is masked in discreet mode for {{{0}}}")
  async checkFromAccountBalanceIsDiscreet(ticker: string) {
    await this.fromAccountBalance.expectTextMatching(
      new RegExp(String.raw`\*\*\*\s+${escapeRegExp(ticker)}`, "i"),
    );
  }

  @Step("Check currency to swap from matches account {{{0.accountName}}}")
  async checkAssetFromMatchesAccount(account: Account) {
    const expectedAccountName = account.parentAccount?.accountName ?? account.accountName;
    await this.fromSelector.expectText(account.currency.ticker, { containing: true });
    await this.fromAccountAccountNameTag.waitVisible();
    await this.fromAccountAccountNameTag.expectText(expectedAccountName, { containing: true });
  }

  @Step("Check currency to swap to is {{{0}}} with amount {{{1}}}")
  async checkAssetTo(currency: string, amount: string) {
    await this.checkAssetToContains(currency);
    await this.toAmountInput.expectText(amount);
  }

  @Step("Check currency to swap to contains {{{0}}}")
  async checkAssetToContains(expectedAssetText: string) {
    const expected = expectedAssetText === "" ? "Choose asset" : expectedAssetText;
    await this.toSelector.expectText(expected, { containing: true });
  }

  @Step("Check currency to swap to matches account {{{0.accountName}}}")
  async checkAssetToMatchesAccount(account: Account) {
    const expectedAccountName = account.parentAccount?.accountName ?? account.accountName;
    await this.toSelector.expectText(account.currency.ticker, { containing: true });
    await this.toAccountAccountNameTag.waitVisible();
    await this.toAccountAccountNameTag.expectText(expectedAccountName, { containing: true });
  }

  @Step("Clear swap account selection from localStorage")
  async clearSwapState() {
    await removeWebviewStorageItems(["from-account", "to-account"]);
  }

  @Step("Check Ledger Nano S not supported banner for {{{0}}}")
  async checkLnsNotSupportedBanner(provider: string) {
    const banner = this.incompatibilityBannerPartner(provider);
    await banner.waitTextMatching(this.lnsUnsupportedBannerPattern, TIMEOUT.large);
    await banner.expectTextMatching(this.lnsUnsupportedBannerPattern);
  }

  @Step("Select specific provider {{{0}}}")
  async selectSpecificProvider(provider: string) {
    const providersList = await this.getProviderList();
    if (!providersList.includes(provider)) {
      throw new Error(`Provider "${provider}" not found in the list`);
    }
    const providerName = SwapProvider.getNameByUiName(provider);
    if (!providerName) {
      throw new Error(`Unknown provider UI name: "${provider}"`);
    }
    await this.tapProviderName(providerName);
  }

  @Step("Go to {{{0}}} live app")
  async goToProviderLiveApp(provider: string) {
    await this.providerExecuteButton(provider).expectExist();
    await this.checkQuoteCardCtaPresence(provider);
    await this.tapExecuteSwap(provider);
  }

  @Step("Verify live app title contains {{{0}}}")
  async verifyLiveAppTitle(expectedText: string) {
    await this.liveAppTitle.expectText(expectedText, { containing: true, ignoreCase: true });
  }

  @Step("Expect reset allowance screen")
  async expectResetApprovalScreen() {
    await this.revokeApprovalButton.waitVisible();
    await this.revokeApprovalButton.expectExist();
  }

  @Step("Tap revoke approval button")
  async tapRevokeApprovalButton() {
    await this.revokeApprovalButton.waitEnabled();
    await this.revokeApprovalButton.tap();
  }

  @Step("Expect TwoStepApprovalScreen")
  async expectTwoStepApprovalScreen() {
    await this.giveApprovalButton.waitVisible();
    await this.giveApprovalButton.expectExist();
  }

  @Step("Tap give Approval button")
  async tapGiveApprovalButton() {
    await this.giveApprovalButton.waitEnabled();
    await this.giveApprovalButton.tap();
  }

  @Step("Tap Give Authorization button")
  async tapGiveAuthorizationButton() {
    await this.signPermitButton.waitVisible(APPROVAL_PROCESSING_TIMEOUT);
    await this.signPermitButton.waitEnabled();
    await this.signPermitButton.tap();
  }
}
