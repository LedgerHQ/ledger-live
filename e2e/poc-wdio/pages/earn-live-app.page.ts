import { getByTestId } from "../components/appiumSelector.ts";
import { step } from "@wdio/allure-reporter";

export class EarnLiveAppPage {
  // webview components
  get footerDisclaimer() {
    return $('[data-testid="footer-disclaimer"]');
  }

  get maxPotentialRewards() {
    return $('[data-testid="max-potential-rewards"]');
  }

  get walletHeaderAmount() {
    return $('[data-testid="wallet-header-amount"]');
  }

  get tokensToEarnBanner() {
    return $('[data-testid="tokens-to-earn-banner"]');
  }

  get iceColdStartEarnCta() {
    return $('[data-testid="ice-cold-start-earn-cta"]');
  }

  getAssetItemTicker(ticker: string) {
    return $(`[data-testid="asset-item-ticker-${ticker}"]`);
  }

  getAssetEarnCta(ticker: string) {
    return $(`[data-testid="asset-earn-cta-${ticker}"]`);
  }

  // state
  private isSwitchedTo = false;

  // steps
  async switchToWebview() {
    if (!this.isSwitchedTo) {
      console.log("Waiting for Earn Live App webview to be displayed...");
      await getByTestId("wallet-api-webview").waitForDisplayed();
      await driver.waitUntil(
        async () => {
          console.log("Switching to Earn Live App...");
          await driver.switchContext({
            title: /earn/i,
            androidWebviewConnectionRetryTime: 5_000,
            androidWebviewConnectTimeout: 30_000,
          });
          // Proof: Chromedriver can query the live app DOM
          await this.footerDisclaimer.waitForDisplayed({ timeout: 5_000 });
          console.log("Switched to Swap Live App!");
          return true;
        },
        {
          interval: 5_000,
          timeout: 120_000,
          timeoutMsg: "Expected to switch to earn live app webview",
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

  async verifyIceColdStartPage() {
    await step("Wait for and verify ice cold start page", async () => {
      await this.webviewAction(async () => {
        await expect(this.footerDisclaimer).toBeDisplayed();
        await expect(this.maxPotentialRewards).not.toBeDisplayed();
        await expect(this.walletHeaderAmount).not.toBeDisplayed();
      });
    });
  }

  async clickIceColdStartEarnCTA() {
    await step("Click ice cold start earn CTA", async () => {
      await this.webviewAction(async () => {
        await expect(this.iceColdStartEarnCta).toBeDisplayed();
        await this.iceColdStartEarnCta.tap();
      });
    });
  }

  async waitForColdStartPage() {
    await step("Wait for cold start page to load", async () => {
      await this.webviewAction(async () => {
        await this.maxPotentialRewards.waitForDisplayed();
      });
    });
  }

  async verifyColdStartPage() {
    await step("Verify cold start page", async () => {
      await this.webviewAction(async () => {
        await expect(this.tokensToEarnBanner).toBeExisting();
      });
    });
  }

  async verifyAssetReadyToEarn(ticker: string) {
    await step(`Verify ${ticker} ready to earn`, async () => {
      await this.webviewAction(async () => {
        await expect(this.getAssetItemTicker(ticker)).toBeExisting();
      });
    });
  }

  async clickAssetEarnCta(ticker: string) {
    await step(`Click ${ticker} earn CTA`, async () => {
      await this.webviewAction(async () => {
        await this.getAssetEarnCta(ticker).tap();
      });
    });
  }

  async verifyEarnFlowStarted(ticker: string) {
    await step(`Verify earn flow started for ${ticker}`, async () => {
      if (ticker !== "ETH") {
        throw new Error(`No earn flow verification mapped for ticker "${ticker}"`);
      }
      await this.waitForWebviewUrlToContain("/deposit");
    });
  }

  private async waitForWebviewUrlToContain(substring: string) {
    await driver.waitUntil(
      async () => {
        const contexts = (await driver.execute("mobile: getContexts")) as Array<{ url?: string }>;
        return contexts.some(context => context?.url?.includes(substring) ?? false);
      },
      {
        timeout: 30_000,
        interval: 1_000,
        timeoutMsg: `Expected a webview URL to contain "${substring}"`,
      },
    );
  }
}
