import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "../misc/reporters/step";
import { WebViewAppPage } from "./webViewApp.page";
import { expect } from "@playwright/test";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { ModularDrawer } from "./drawer/modular.drawer";

export class EarnPage extends WebViewAppPage {
  private earnMoreRewardTabButton = "tab-earn-more";
  private earnAppContainer = this.page.getByTestId("earn-app-container");
  private stakeCryptoAssetsButton = "stake-crypto-assets-button";
  private potentialRewardsBalanceCard = "Rewards you could earn-balance-card";
  private amountAvailableBalanceCard = "Amount available to earn-balance-card";
  private amountAvailableAssetsText = "  Amount available to earn";
  private rewardsPotentialText = "Rewards you could earn";
  private availableAssetsText = "Available assets";
  private totalRewardsText = "Total rewards";
  private totalDepositedBalanceCard = "Total deposited-balance-card";
  private totalRewardsBalanceCard = "Total rewards-balance-card";
  private depositedAssetsText = "Deposited assets";
  private tabAssetsButton = "tab-assets";
  private learnMoreButton = (currency: string) => `get-${currency}-button`;

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);
  private modularDrawer = new ModularDrawer(this.page);

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
    if (await buttonLocator.isVisible()) {
      await buttonLocator.click();
    }
  }

  @step("Click on stake button for $1")
  async clickStakeCurrencyButton(account: string) {
    const webview = await this.getWebView();
    const row = webview.locator("tr", { hasText: `${account}` });
    await row.getByRole("button", { name: "Earn" }).first().click();
  }

  @step("Expect live App to be visible")
  async expectLiveAppToBeVisible() {
    const webview = await this.getWebView();
    await expect(this.earnAppContainer).toBeVisible();
    await expect(webview.locator(`[data-test-id="${this.stakeCryptoAssetsButton}"]`)).toBeVisible();
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
    if (await this.modularDrawer.isModularAssetsDrawerVisible()) {
      await this.modularDrawer.validateAssetsDrawerItems();
      return;
    }
    await this.chooseAssetDrawer.verifyChooseAssetDrawer();
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
        await this.expectUrlToContainAll(url, [
          account.currency.id,
          `staderlabs.com/${account.currency.ticker}`,
          account.address,
        ]);
        break;
      }
      case "Kiln staking Pool": {
        await this.expectUrlToContainAll(url, [account.currency.id, "kiln.fi%2F%3Ffocus%3Dpooled"]);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }

  @step("Click on learn more button for $1")
  async clickLearnMoreButton(currency: string) {
    await this.clickElement(this.learnMoreButton(currency));
  }
}
