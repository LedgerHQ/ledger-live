import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { ChooseAssetDrawer } from "./drawer/choose.asset.drawer";
import { ModularDialog } from "./dialog/modular.dialog";
import { EarnBasePage } from "./earn.base.page";

export class EarnPage extends EarnBasePage {
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
  private learnMoreButton = (currency: string) => `get-${currency}-button`;

  private chooseAssetDrawer = new ChooseAssetDrawer(this.page);
  private modularDialog = new ModularDialog(this.page);

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

  @step("Click on learn more button for $0")
  async clickLearnMoreButton(currency: string) {
    await this.clickElement(this.learnMoreButton(currency));
  }
}
