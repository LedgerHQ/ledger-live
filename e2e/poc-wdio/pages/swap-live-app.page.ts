import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { floatNumberRegex } from "@ledgerhq/live-common/e2e/data/regexes";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getByTestId } from "../components/appiumSelector.ts";
import { step } from "@wdio/allure-reporter";

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

  get quotesCountDown() {
    return $('[data-testid="quotes-countdown"]');
  }

  get mainContainer() {
    return $("main");
  }

  get quoteCardProviderNames() {
    return this.mainContainer.$$("[data-testid^='compact-quote-card-provider-']");
  }

  // dynamic components
  public getQuoteCardByProviderName(providerName: string) {
    return $(`[data-testid="compact-quote-card-provider-name-${providerName.toLowerCase()}"]`);
  }

  public providerExecuteButton(provider: string) {
    return $(`${this.baseProviderCssSelector(provider)} [data-testid="execute-button"]`);
  }

  // reusable selectors
  private baseProviderCssSelector(provider: string) {
    return `[data-testid^="quote-container-${SwapProvider.getNameByUiName(provider)}"]`;
  }

  // state
  private isSwitchedTo = false;

  // steps
  async switchToWebview() {
    if (!this.isSwitchedTo) {
      console.log("Waiting for Swap Live App webview to be displayed...");
      await getByTestId("wallet-api-webview").waitForDisplayed();
      await driver.waitUntil(
        async () => {
          console.log("Switching to Swap Live App...");
          await driver.switchContext({
            title: /swap/i,
            androidWebviewConnectionRetryTime: 5_000,
            androidWebviewConnectTimeout: 30_000,
          });
          // Proof: Chromedriver can query the live app DOM
          await this.fromSelector.waitForDisplayed({ timeout: 5_000 });
          console.log("Switched to Swap Live App!");
          return true;
        },
        {
          interval: 5_000,
          timeout: 120_000,
          timeoutMsg: "Expected to switch to swap live app webview",
        },
      );
      this.isSwitchedTo = true;
    }
  }

  private async webviewAction<T>(action: () => Promise<T>): Promise<T> {
    // store current context to avoid unnecessary switching for nested calls
    const wasAlreadyInWebview = this.isSwitchedTo;

    // ensure we're in the webview before performing the action
    await this.switchToWebview();
    try {
      return await action();
    } finally {
      if (!wasAlreadyInWebview) {
        // only switch back to native context if we switched for this action
        await driver.switchAppiumContext("NATIVE_APP");
        this.isSwitchedTo = false;
      }
    }
  }

  async expectLiveApp() {
    await step("Expect swap live app to be displayed", async () => {
      await this.webviewAction(async () => {
        await expect(this.fromSelector).toBeDisplayed();
        await expect(this.toSelector).toBeDisplayed();
      });
    });
  }

  async getMinimumAmount(
    fromAccount: Account,
    toAccount: Account,
    providersWhitelist?: string[],
  ): Promise<string> {
    return await step("Get minimum amount for swap", async () => {
      return (
        (await getMinimumSwapAmount(fromAccount, toAccount, providersWhitelist))?.toString() ?? ""
      );
    });
  }

  async getFromCurrencyTexts(): Promise<string> {
    return await step("Get FROM currency text", async () => {
      return await this.webviewAction(async () => {
        const text = await this.fromSelector.getText();
        return text;
      });
    });
  }

  async getToCurrencyTexts(): Promise<string> {
    return await step("Get TO currency text", async () => {
      return await this.webviewAction(async () => {
        const text = await this.toSelector.getText();
        return text;
      });
    });
  }

  async tapFromCurrency() {
    await step("Tap FROM currency", async () => {
      await this.webviewAction(async () => {
        await this.fromSelector.tap();
      });
    });
  }

  async tapToCurrency() {
    await step("Tap TO currency", async () => {
      await this.webviewAction(async () => {
        await this.toSelector.tap();
      });
    });
  }

  async verifyCurrencyIsSelected(ticker: string, isFromCurrency: boolean) {
    await step(
      `Verify ${isFromCurrency ? "FROM" : "TO"} currency is selected: ${ticker}`,
      async () => {
        await this.webviewAction(async () => {
          const selectorToValidate = isFromCurrency ? this.fromSelector : this.toSelector;
          await expect(selectorToValidate).toHaveText(expect.stringContaining(ticker));
        });
      },
    );
  }

  async inputFromAmount(amount: string) {
    await step(`Input FROM amount: ${amount}`, async () => {
      await this.webviewAction(async () => {
        for (const char of amount) {
          await this.fromAmountInput.addValue(char);
          await driver.pause(50);
        }
      });
    });
  }

  async expectToAmountFloat() {
    await step("Expect TO amount to be a float number", async () => {
      await this.webviewAction(async () => {
        await expect(this.toAmountInput).toHaveText(floatNumberRegex);
      });
    });
  }

  async tapGetQuotesButton() {
    await step("Tap Get Quotes button", async () => {
      await this.webviewAction(async () => {
        await this.getQuotesButton.tap();
      });
    });
  }

  async waitForQuotes() {
    await step("Wait for quotes", async () => {
      await this.webviewAction(async () => {
        await this.numberOfQuotes.waitForDisplayed();
        await this.waitForQuotesStable();
      });
    });
  }

  async waitForQuotesStable(timeout: number = 20000) {
    await step("Wait for quotes to be stable", async () => {
      await this.webviewAction(async () => {
        await driver.waitUntil(
          async () => {
            const countdownText = await this.quotesCountDown.getText();
            const currentSeconds = Number.parseInt(countdownText.replaceAll(/\D/g, ""), 10);

            if (Number.isNaN(currentSeconds)) {
              throw new TypeError(`Could not parse countdown value: ${countdownText}`);
            }

            if (currentSeconds < 2 || currentSeconds > 19) {
              console.log(`Countdown is ${currentSeconds}s, waiting for value between 2-19s`);
              return false;
            }
            return currentSeconds;
          },
          {
            timeout,
            timeoutMsg: `Expected countdown to stabilize within ${timeout}ms`,
          },
        );
      });
    });
  }

  async getProviderList(): Promise<string[]> {
    return await step("Get provider list", async () => {
      return await this.webviewAction(async () => {
        await expect(this.numberOfQuotes).toBeDisplayed();
        await expect(this.quotesCountDown).toBeDisplayed();

        const providerList = await driver.waitUntil(
          async () => {
            const numberOfQuotesText = await this.numberOfQuotes.getText();
            const providerList = await this.quoteCardProviderNames.map(card => card.getText());

            if (!numberOfQuotesText.match(new RegExp(`^${providerList.length} quotes? found$`))) {
              console.log(
                `Quote count mismatch: UI shows "${numberOfQuotesText}" but found ${providerList.length} cards`,
              );
              return false;
            }
            return providerList;
          },
          {
            timeout: 30_000,
            timeoutMsg: "Expected provider list to be up to date within 30s",
          },
        );
        return providerList;
      });
    });
  }

  async selectExchange() {
    return await step("Select exchange provider", async () => {
      return await this.webviewAction(async () => {
        const providers = await this.getProviderList();
        const providersList = providers.filter(name => name !== SwapProvider.LIFI.uiName);

        const providersWithoutKYC = providersList.filter(providerName => {
          const provider = Object.values(SwapProvider).find(p => p.uiName === providerName);
          // return provider && !provider.kyc; -> original
          return provider && !provider.kyc && provider.name !== SwapProvider.OKX.name;
        });

        let selectedProvider;

        for (const providerName of providersWithoutKYC) {
          const provider = SwapProvider.getByUiName(providerName);
          if (provider && !provider.kyc && !provider.app) {
            await this.getQuoteCardByProviderName(provider.name).tap();
            selectedProvider = provider;
            break;
          }
        }
        if (!selectedProvider) {
          throw new Error("No providers without KYC found");
        }
        return selectedProvider;
      });
    });
  }

  async checkExchangeButtonHasProviderName(provider: string): Promise<string> {
    return await step(`Check exchange button has provider name: ${provider}`, async () => {
      return await this.webviewAction(async () => {
        await expect(this.providerExecuteButton(provider)).toHaveText(
          new RegExp(`^(Swap|Continue) with ${provider}$`, "i"),
        );
        const buttonText = await this.providerExecuteButton(provider).getText();
        return buttonText;
      });
    });
  }

  async tapExecuteSwap(provider: string) {
    await step(`Tap execute swap for provider: ${provider}`, async () => {
      await this.webviewAction(async () => {
        await this.providerExecuteButton(provider).tap();
      });
    });
  }
}
