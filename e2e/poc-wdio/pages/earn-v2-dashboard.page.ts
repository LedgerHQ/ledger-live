import { getByTestId } from "../components/appiumSelector.ts";
import { step } from "@wdio/allure-reporter";

export class EarnV2DashboardPage {
  private isSwitchedTo = false;

  private readonly footerDisclaimer = '[data-testid="footer-disclaimer"]';
  private readonly maxPotentialRewards = '[data-testid="max-potential-rewards"]';
  private readonly walletHeaderAmount = '[data-testid="wallet-header-amount"]';
  private readonly iceColdStartEarnCta = '[data-testid="ice-cold-start-earn-cta"]';

  private get depositAmountButton() {
    return driver.isIOS
      ? $('-ios predicate string:name == "Select amount"')
      : $('android=new UiSelector().textContains("Select amount")');
  }

  private async isDepositFlowVisibleInWebview() {
    return await browser.execute(() => {
      const url = new URL(window.location.href);
      const queryIntent = url.searchParams.get("intent");
      if (queryIntent === "deposit" || url.pathname.includes("/deposit")) {
        return true;
      }
      return !!document.querySelector('[data-testid="amount-input-section-input"]');
    });
  }

  private async isDepositFlowVisibleNative() {
    return await this.depositAmountButton.isDisplayed().catch(() => false);
  }

  async switchToWebview({ iceColdStart = false }: { iceColdStart?: boolean } = {}) {
    if (!this.isSwitchedTo) {
      await getByTestId("wallet-api-webview").waitForDisplayed();
      await driver.waitUntil(
        async () => {
          await driver.switchContext({
            title: /earn/i,
            androidWebviewConnectionRetryTime: 5_000,
            androidWebviewConnectTimeout: 30_000,
          });
          if (iceColdStart) {
            await $(this.footerDisclaimer).waitForDisplayed({ timeout: 5_000 });
          } else {
            await browser.execute(() => document.readyState);
          }
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

  private async webviewAction<T>(
    action: () => Promise<T>,
    options?: { iceColdStart?: boolean },
  ): Promise<T> {
    const wasAlreadyInWebview = this.isSwitchedTo;
    await this.switchToWebview(options);
    try {
      return await action();
    } finally {
      if (!wasAlreadyInWebview) {
        await driver.switchAppiumContext("NATIVE_APP");
        this.isSwitchedTo = false;
      }
    }
  }

  async verifyIceColdStartPage() {
    await step("Verify ice cold start page", async () => {
      await this.webviewAction(
        async () => {
          await expect($(this.footerDisclaimer)).toBeDisplayed();
          await expect($(this.maxPotentialRewards)).not.toBeDisplayed();
          await expect($(this.walletHeaderAmount)).not.toBeDisplayed();
        },
        { iceColdStart: true },
      );
    });
  }

  async clickIceColdStartEarnCTA() {
    await step("Click ice cold start earn CTA", async () => {
      await this.webviewAction(
        async () => {
          await $(this.iceColdStartEarnCta).click();
        },
        { iceColdStart: true },
      );
    });
  }

  async verifyDepositFlowVisible() {
    await step("Verify earn webview redirected to deposit flow", async () => {
      this.isSwitchedTo = false;
      await driver.switchAppiumContext("NATIVE_APP");

      await driver.waitUntil(
        async () => {
          if (await this.isDepositFlowVisibleNative()) {
            return true;
          }

          if (driver.isAndroid) {
            return await this.webviewAction(async () => this.isDepositFlowVisibleInWebview());
          }

          return false;
        },
        {
          interval: 1_000,
          timeout: 60_000,
          timeoutMsg: "Expected earn webview to show the deposit flow",
        },
      );
    });
  }

  async verifyEarnFlowStarted(ticker: string) {
    await step(`Verify earn flow started for ${ticker}`, async () => {
      if (ticker === "ETH") {
        await this.verifyDepositFlowVisible();
      } else {
        throw new Error(`No earn flow verification mapped for ticker "${ticker}"`);
      }
    });
  }
}
