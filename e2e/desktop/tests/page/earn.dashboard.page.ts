import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { ElectronApplication, expect } from "@playwright/test";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";

export class EarnPage extends AppPage {
  private earnMoreRewardTabButton = "tab-earn-more";
  private earnAppContainer = this.page.getByTestId("earn-app-container");
  private stakeCryptoAssetsButton = "stake-crypto-assets-button";
  private rewardsBalanceCard = "Est. rewards-balance-card";
  private holdingsBalanceCard = "Your holdings-balance-card";
  private rewardsPotentialText = "Rewards potential";
  private yourEligibleAssetsText = "Your eligible assets";
  private eligibleAssetsText = "Eligible assets";
  private totalRewardsEarnedText = "Total rewards earned";
  private totalAssetsEarningRewardsCard = "Total assets earning rewards-balance-card";
  private totalRewardsBalanceCard = "Total rewards-balance-card";
  private assetsEarningRewardsText = "Assets earning rewards";
  private tabAssetsButton = "tab-assets";
  private learnMoreButton = (currency: string) => `get-${currency}-button`;

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);

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
  async goToAssetsTab(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    const buttonLocator = webview.locator(`[data-test-id="${this.tabAssetsButton}"]`);
    await buttonLocator.click();
  }

  @step("Go to earn more tab")
  async goToEarnMoreTab(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    const buttonLocator = webview.locator(`[data-test-id="${this.earnMoreRewardTabButton}"]`);
    if (await buttonLocator.isVisible()) {
      await buttonLocator.click();
    }
  }

  @step("Click on stake button for $1")
  async clickStakeCurrencyButton(electronApp: ElectronApplication, account: string) {
    const [, webview] = electronApp.windows();
    const row = webview.locator("tr", { hasText: `${account}` });
    await row.getByRole("button", { name: "Earn" }).first().click();
  }

  @step("Expect live App to be visible")
  async expectLiveAppToBeVisible(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await expect(this.earnAppContainer).toBeVisible();
    await expect(webview.locator(`[data-test-id="${this.stakeCryptoAssetsButton}"]`)).toBeVisible();
  }

  @step("Verify rewards potential is visible")
  async verifyRewardsPotentials(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await this.expectTextToBeVisible(electronApp, this.rewardsPotentialText);
    await expect(webview.getByTestId(this.holdingsBalanceCard)).toBeVisible();
    await expect(webview.getByTestId(this.rewardsBalanceCard)).toBeVisible();
  }

  @step("Verify total rewards earned is visible")
  async verifyTotalRewardsEarned(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    await this.expectTextToBeVisible(electronApp, this.totalRewardsEarnedText);
    await expect(webview.getByTestId(this.totalAssetsEarningRewardsCard)).toBeVisible();
    await expect(webview.getByTestId(this.totalRewardsBalanceCard)).toBeVisible();
  }

  @step("Verify Assets earning rewards is visible")
  async verifyAssetsEarningRewards(electronApp: ElectronApplication, account: string) {
    const [, webview] = electronApp.windows();
    await expect(
      webview.getByRole("heading", { name: this.assetsEarningRewardsText, exact: true }),
    ).toBeVisible();
    await expect(webview.getByText(account).first()).toBeVisible();
  }

  @step("Verify 'your eligible assets' is visible")
  async verifyYourEligibleAssets(electronApp: ElectronApplication, account: string) {
    const [, webview] = electronApp.windows();
    await this.expectTextToBeVisible(electronApp, this.yourEligibleAssetsText);
    const row = webview.locator("tr", { hasText: `${account}` });
    await expect(row.getByRole("button", { name: "Earn" }).first()).toBeEnabled();
  }

  @step("Verify eligible assets are visible")
  async verifyEligibleAssets(electronApp: ElectronApplication, account: Account) {
    const [, webview] = electronApp.windows();
    await this.expectTextToBeVisible(electronApp, this.eligibleAssetsText);
    await expect(webview.getByTestId(this.learnMoreButton(account.currency.id))).toBeEnabled();
  }

  @step("Verify earn by stacking button is visible")
  async verifyEarnByStackingButton(electronApp: ElectronApplication) {
    const [, webview] = electronApp.windows();
    const earnButton = webview.locator(`[data-test-id="${this.stakeCryptoAssetsButton}"]`);
    await expect(earnButton).toBeVisible();
    await expect(earnButton).toBeEnabled();
    await earnButton.click();
    await this.chooseAssetDrawer.verifyChooseAssetDrawer();
  }

  @step("Verify provider URL")
  async verifyProviderURL(
    electronApp: ElectronApplication,
    selectedProvider: string,
    account: Account,
  ) {
    const newWindow = await electronApp.waitForEvent("window");

    await newWindow.waitForLoadState();

    const url = newWindow.url();

    switch (selectedProvider) {
      case "Lido": {
        this.expectUrlToContainAll(url, [account.currency.id, "stake.lido.fi"]);
        break;
      }
      case "Stader Labs": {
        this.expectUrlToContainAll(url, [
          account.currency.id,
          `staderlabs.com/${account.currency.ticker}`,
          account.address,
        ]);
        break;
      }
      case "Kiln staking Pool": {
        this.expectUrlToContainAll(url, [account.currency.id, "kiln.fi%2F%3Ffocus%3Dpooled"]);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }

  @step("Click on learn more button for $1")
  async clickLeanrMoreButton(electronApp: ElectronApplication, currency: string) {
    const [, webview] = electronApp.windows();
    const buttonLocator = webview.getByTestId(this.learnMoreButton(currency));
    await buttonLocator.click();
  }

  @step("Expect text to be visible")
  async expectTextToBeVisible(electronApp: ElectronApplication, text: string) {
    const [, webview] = electronApp.windows();
    await expect(webview.getByText(text, { exact: true })).toBeVisible();
  }
}
