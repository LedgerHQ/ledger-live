import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";
import { expect } from "@playwright/test";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { ModularDialog } from "./dialog/modular.dialog";

export class EarnPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "earn";

  private earnMoreRewardTabButton = "tab-earn-more";
  private stakeCryptoAssetsButton = "stake-crypto-assets-button";
  private potentialRewardsBalanceCard = "Rewards you could earn-balance-card";
  private amountAvailableBalanceCard = "Amount available to earn-balance-card";
  private amountAvailableAssetsText = "  Amount available to earn";
  private rewardsPotentialText = "Rewards you could earn";
  private totalRewardsText = "Total rewards";
  private totalDepositedBalanceCard = "Total deposited-balance-card";
  private totalRewardsBalanceCard = "Total rewards-balance-card";
  private depositedAssetsText = "Deposited assets";
  private tabAssetsButton = "tab-assets";
  private loadingSkeleton = "loading-skeleton";
  private learnMoreButton = (currency: string) => `get-${currency}-button`;

  // V2 selectors
  private maxPotentialRewards = "max-potential-rewards";
  private walletHeaderAmount = "wallet-header-amount";
  private rewardsSummary = "rewards-summary";
  private tokensToEarnBanner = "tokens-to-earn-banner";
  private footerDisclaimer = "footer-disclaimer";
  private assetItemTicker = (ticker: string) => `asset-item-ticker-${ticker.toLowerCase()}`;

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);
  private modularDialog = new ModularDialog(this.page);

  @step("Go and wait for Earn app to be ready")
  async goAndWaitForEarnToBeReady(earnFunction: () => Promise<void>) {
    const appReadyPromise = new Promise<void>(resolve => {
      this.page.on("console", msg => {
        if (msg.type() === "info" && msg.text().includes("Earn Live App Loaded")) {
          resolve();
        }
      });
    });

    await earnFunction();
    await appReadyPromise;

    const webview = await this.getWebView();
    await webview.getByTestId(this.loadingSkeleton).first().waitFor({ state: "hidden" });
  }

  @step("Go to assets tab")
  async goToAssetsTab() {
    const webview = await this.getWebView();
    const buttonLocator = webview.locator(`[data-test-id="${this.tabAssetsButton}"]`);
    await buttonLocator.click();
  }

  @step("Go to earn more tab")
  async goToEarnMoreTab() {
    const webview = await this.getWebView();
    const buttonLocator = webview.locator(`[data-test-id="${this.earnMoreRewardTabButton}"]`);
    await buttonLocator.click();
  }

  @step("Click on stake button")
  async clickStakeCurrencyButton(account: Account) {
    const webview = await this.getWebView();
    const row = webview.getByRole("row", {
      // include ticker in case tokens also exist on the account (eg Ethereum with USDC)
      name: `${account.currency.ticker} ${account.accountName}`,
    });
    await row.getByRole("button", { name: "Earn" }).click();
  }

  @step("Verify rewards potential is visible")
  async verifyRewardsPotentials() {
    const webview = await this.getWebView();
    await this.expectTextToBeVisible(this.rewardsPotentialText);
    await expect(webview.getByTestId(this.amountAvailableBalanceCard)).toBeVisible();
    await expect(webview.getByTestId(this.potentialRewardsBalanceCard)).toBeVisible();
  }

  @step("Verify total rewards earned is visible")
  async verifyTotalRewardsEarned() {
    await this.expectTextToBeVisible(this.totalRewardsText);
    await this.verifyElementIsVisible(this.totalDepositedBalanceCard);
    await this.verifyElementIsVisible(this.totalRewardsBalanceCard);
  }

  @step("Verify Assets earning rewards is visible")
  async verifyAssetsEarningRewards(account: string) {
    const webview = await this.getWebView();
    await expect(
      webview.getByRole("heading", { name: this.depositedAssetsText, exact: true }),
    ).toBeVisible();
    await expect(webview.getByText(account).first()).toBeVisible();
  }

  @step("Verify 'your eligible assets' is visible")
  async verifyYourEligibleAssets(account: string) {
    const webview = await this.getWebView();
    await this.expectTextToBeVisible(this.amountAvailableAssetsText);
    const row = webview.locator("tr", { hasText: `${account}` });
    await expect(row.getByRole("button", { name: "Earn" }).first()).toBeEnabled();
  }

  @step("Verify earn by stacking button is visible")
  async verifyEarnByStackingButton() {
    const webview = await this.getWebView();
    const earnButton = webview.locator(`[data-test-id="${this.stakeCryptoAssetsButton}"]`);
    await expect(earnButton).toBeVisible();
    await expect(earnButton).toBeEnabled();
    await earnButton.click();

    const selector = await this.getModularSelector();
    if (selector) {
      await selector.validateItems();
    } else {
      await this.chooseAssetDrawer.verifyChooseAssetDrawer();
    }
  }

  private async getModularSelector() {
    if (await this.modularDialog.isVisible()) return this.modularDialog;
    return null;
  }

  @step("Verify provider URL")
  async verifyProviderURL(selectedProvider: string, account: Account) {
    const newWindow = await this.waitForNewWindow();
    const url = newWindow.url();

    switch (selectedProvider) {
      case "Lido": {
        await this.expectUrlToContainAll(url, [account.currency.id, "stake.lido.fi"]);
        break;
      }
      case "Stader Labs": {
        const expectedStringArray = [
          account.currency.id,
          `staderlabs.com/${account.currency.ticker}`,
          // defensive optional spread as account address might not be set
          ...(account.address ? [account.address] : []),
        ];
        await this.expectUrlToContainAll(url, expectedStringArray);
        break;
      }
      case "Kiln staking Pool": {
        await this.expectUrlToContainAll(url, [
          account.currency.id,
          "ledger-staking.widget.kiln.fi/earn",
          "focus=pooled",
          account.address!,
        ]);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }

  @step("Click on learn more button for $0")
  async clickLearnMoreButton(currency: string) {
    await this.clickElement(this.learnMoreButton(currency));
  }

  // V2 Ice Cold Start

  @step("Verify ice cold start page")
  async verifyIceColdStartPage() {
    await this.verifyElementIsVisible(this.footerDisclaimer);
    await this.verifyElementIsNotVisible(this.maxPotentialRewards);
    await this.verifyElementIsNotVisible(this.walletHeaderAmount);
  }

  @step("Click ice cold start earn CTA")
  async clickIceColdStartEarnCTA() {
    const webview = await this.getWebView();
    await webview.getByRole("button", { name: /earn/i }).first().click();
  }

  // V2 Cold Start

  @step("Verify cold start page")
  async verifyColdStartPage() {
    await this.verifyElementIsVisible(this.maxPotentialRewards);
    await this.verifyElementIsVisible(this.tokensToEarnBanner);
  }

  @step("Verify asset ready to earn: $0")
  async verifyAssetReadyToEarn(ticker: string) {
    await this.verifyElementIsVisible(this.assetItemTicker(ticker));
  }

  @step("Click asset earn CTA for $0")
  async clickAssetEarnCta(ticker: string) {
    const webview = await this.getWebView();
    const assetRow = webview.getByTestId(this.assetItemTicker(ticker));
    await assetRow.getByRole("button", { name: /earn/i }).first().click();
  }

  // V2 Hot Start

  @step("Verify hot start page")
  async verifyHotStartPage() {
    await this.verifyElementIsVisible(this.walletHeaderAmount);
  }

  @step("Verify rewards summary boxes")
  async verifyRewardsSummaryBoxes() {
    await this.verifyElementIsVisible(this.rewardsSummary);
  }

  @step("Verify position row present: $0")
  async verifyPositionRowPresent(identifier: string) {
    const webview = await this.getWebView();
    const row = webview.getByTestId(/^deposit-row-/).filter({ hasText: identifier });
    await expect(row.first()).toBeVisible();
  }

  @step("Click position row: $0")
  async clickPositionRow(identifier: string) {
    const webview = await this.getWebView();
    const row = webview.getByTestId(/^deposit-row-/).filter({ hasText: identifier });
    await row.first().click();
  }

  @step("Verify navigated away from earn dashboard")
  async verifyNavigatedFromDashboard() {
    await this.verifyElementIsNotVisible(this.tokensToEarnBanner);
    await this.verifyElementIsNotVisible(this.maxPotentialRewards);
  }

  @step("Verify navigated to deposit flow")
  async verifyDepositFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(/\/deposit/);
  }

  @step("Verify navigated to withdrawal flow")
  async verifyWithdrawalFlowVisible() {
    const webview = await this.getWebView();
    await expect(webview).toHaveURL(/\/redeem|intent=withdraw/);
  }

  @step("Get stake platform for currency: $0")
  async getStakePlatform(currencyId: string): Promise<string | null> {
    const webview = await this.getWebView();
    const url = webview.url();
    const param = new URL(url).searchParams.get("stakeProgramsParam");
    if (!param) return null;
    const redirects: Record<string, string> = JSON.parse(param);
    return redirects[currencyId] ?? null;
  }
}
