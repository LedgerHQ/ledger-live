import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { allure } from "jest-allure2-reporter/api";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapLiveAppPage {
  fromSelector = "from-account-coin-selector";
  fromAmount = "from-account";
  fromAmountInput = "from-account-amount-input";
  toSelector = "to-account-coin-selector";
  getQuotesButton = "mobile-get-quotes-button";
  numberOfQuotes = "number-of-quotes";
  quoteProviderName = "quote-card-provider-name";
  executeSwapButton = "execute-button";

  @Step("Wait for swap live app")
  async waitForSwapLiveApp() {
    await waitWebElementByTestId(this.getQuotesButton);
  }

  @Step("Tap from currency")
  async tapFromCurrency() {
    await tapWebElementByTestId(this.fromSelector);
  }

  @Step("Tap to currency")
  async tapToCurrency() {
    await tapWebElementByTestId(this.toSelector);
  }

  @Step("Input amount")
  async inputAmount(amount: string) {
    await typeTextByWebTestId(this.fromAmountInput, amount);
  }

  @Step("Tap get quotes button")
  async tapGetQuotesButton() {
    await tapWebElementByTestId(this.getQuotesButton);
  }

  @Step("Wait for quotes")
  async waitForQuotes() {
    await waitWebElementByTestId(this.numberOfQuotes);
  }

  @Step("Select available provider")
  async selectExchange() {
    let index = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const providerName = await getWebElementText(this.quoteProviderName, index);
        const provider = Object.values(Provider).find(p => p.uiName === providerName);

        if (provider && !provider.kyc && provider.isNative) {
          await getWebElementByTestId(this.quoteProviderName, index).tap();
          await allure.attachment("Selected provider: ", providerName, "text/plain");
          return providerName;
        }

        index++;
      } catch (e) {
        break;
      }
    }
    throw new Error("No valid providers found");
  }

  @Step("Tap execute swap button")
  async tapExecuteSwap() {
    await tapWebElementByTestId(this.executeSwapButton, 1);
  }

  @Step("Get minimum amount for swap")
  async getMinimumAmount(swap: SwapType) {
    return (
      (await getMinimumSwapAmount(swap.accountToDebit, swap.accountToCredit))?.toString() ?? ""
    );
  }
}
