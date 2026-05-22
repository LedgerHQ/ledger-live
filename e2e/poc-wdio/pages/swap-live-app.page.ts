import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { floatNumberRegex } from "@ledgerhq/live-common/e2e/data/regexes";

export class SwapLiveAppPage {
  // webview components
  get fromSelector() {
    return $('[data-testid="from-account-coin-selector"]');
  }

  get fromAmountInput() {
    return $('[data-testid="from-account-amount-input"]');
  }

  get toSelector() {
    return $('[data-testid="to-account-coin-selector"]');
  }

  get toAmountInput() {
    return $('[data-testid="to-account-amount-input"]');
  }

  get quotesButtonDisabled() {
    return $('[data-testid="mobile-get-quotes-button-disabled"]');
  }

  get getQuotesButton() {
    return $('[data-testid="mobile-get-quotes-button"]');
  }

  get numberOfQuotes() {
    return $('[data-testid="number-of-quotes"]');
  }

  // steps
  async switchTo() {
    await driver.waitUntil(
      async () => {
        await driver.switchContext({ title: /swap/i });
        return true;
      },
      {
        timeout: 15_000,
        timeoutMsg: "Expected to find swap live app context",
      },
    );
  }
  async expectLiveApp() {
    // DETOX:
    // await waitWebElementByTestId(this.fromSelector);
    // await detoxExpect(getWebElementByTestId(this.fromSelector)).toExist();
    // await detoxExpect(getWebElementByTestId(this.toSelector)).toExist();
    // await detoxExpect(getWebElementByTestId(this.quotesButtonDisabled)).toExist();

    // WDIO:
    await this.switchTo();
    await expect(this.fromSelector).toBeDisplayed();
    await expect(this.toSelector).toBeDisplayed();
    await expect(this.quotesButtonDisabled).toBeDisplayed();
    await driver.switchContext("NATIVE_APP");
  }

  async getMinimumAmount(fromAccount: Account, toAccount: Account, providersWhitelist?: string[]) {
    return (
      (await getMinimumSwapAmount(fromAccount, toAccount, providersWhitelist))?.toString() ?? ""
    );
  }

  async getFromCurrencyTexts() {
    await this.switchTo();
    const text = await this.fromSelector.getText();
    await driver.switchContext("NATIVE_APP");
    return text;
  }

  async getToCurrencyTexts() {
    await this.switchTo();
    const text = await this.toSelector.getText();
    await driver.switchContext("NATIVE_APP");
    return text;
  }

  async tapFromCurrency() {
    await this.switchTo();
    await this.fromSelector.tap();
    await driver.switchContext("NATIVE_APP");
  }

  async tapToCurrency() {
    await this.switchTo();
    await this.toSelector.tap();
    await driver.switchContext("NATIVE_APP");
  }

  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    await this.switchTo();
    const selectorToValidate = isFromCurrency ? this.fromSelector : this.toSelector;
    await expect(selectorToValidate).toHaveText(expect.stringContaining(ticker));
    await driver.switchContext("NATIVE_APP");
  }

  async inputFromAmount(amount: string) {
    await this.switchTo();
    await this.fromAmountInput.setValue(amount);
    await driver.switchContext("NATIVE_APP");
  }

  async expectToAmountFloat() {
    await this.switchTo();
    await expect(this.toAmountInput).toHaveText(floatNumberRegex);
    await driver.switchContext("NATIVE_APP");
  }

  async tapGetQuotesButton() {
    await this.switchTo();
    await this.getQuotesButton.tap();
    await driver.switchContext("NATIVE_APP");
  }

  async waitForQuotes() {
    await this.switchTo();
    await this.numberOfQuotes.waitForDisplayed();
    // TODO: implement this!
    // await this.waitForQuotesStable();
    await driver.switchContext("NATIVE_APP");
  }
}
