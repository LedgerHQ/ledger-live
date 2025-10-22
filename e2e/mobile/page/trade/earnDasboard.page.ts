import { normalizeText } from "helpers/commonHelpers";
import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export default class EarnDashboardPage {
  amountAvailableAssetsText = "Amount available to earn";
  amountAvailableToEarnBalanceCard = "Amount available to earn-balance-card";
  assetsTitleId = "assets-title-text";
  earnButtonSelector = '[data-testid^="stake-"][data-testid$="-button"]';
  getAssetsPlaceholderHero = "get-assets-placeholder-hero";
  rewardsPotentialBalanceCard = "Rewards you could earn-balance-card";
  rewardsPotentialText = "Rewards you could earn";
  stakeCryptoAssetsButton = "stake-crypto-assets-button";
  stakingProviderModalTitle = "staking-provider-modal-title";
  tableEarnMoreSelector =
    '[data-testid="earn-more-table"], [data-testid="multi-header-table-earn-more"]';
  tableRewardsEarnedSelector =
    '[data-testid="rewards-earned-table"], [data-testid="multi-header-table-rewards-earned"]';
  totalDepositedBalanceCard = "Total deposited-balance-card";
  totalDepositedText = "Total deposited";
  totalRewardsBalanceCard = "Total rewards-balance-card";
  totalRewardsText = "Total rewards";

  stakingProviderTitle = (providerName: string) => `staking-provider-${providerName}-title`;
  assetsTitleText = (withStaking: boolean) =>
    withStaking ? "Deposited assets" : "Available assets";

  providers = (account: Account) => {
    return {
      Lido: { name: "Lido", url: "stake.lido.fi" },
      Stader_Labs: {
        name: "Stader Labs",
        url: `staderlabs.com/${account.currency.ticker.toLowerCase()}`,
      },
      Kiln_staking_Pool: { name: "Kiln staking Pool", url: "kiln.fi%2F%3Ffocus%3Dpooled" },
    };
  };

  @Step("Click on earn button")
  async clickEarnCurrencyButton() {
    const elem = getWebElementByCssSelector(this.earnButtonSelector);
    await tapWebElementByElement(elem);
  }

  @Step("Expect staking provider modal title")
  async expectStakingProviderModalTitle(title: string) {
    const modalTitle = await getTextOfElement(this.stakingProviderModalTitle);
    jestExpect(normalizeText(modalTitle)).toContain(title);
  }

  @Step("Go to provider live app")
  async goToProviderLiveApp(provider: Provider) {
    const uiName = await getTextOfElement(this.stakingProviderTitle(provider.name));
    await scrollToText(uiName);
    jestExpect(normalizeText(uiName)).toBe(provider.uiName);
    await tapById(this.stakingProviderTitle(provider.name));
  }

  @Step("verify provider URL")
  async verifyProviderURL(provider: Provider, account: Account) {
    const url = await getCurrentWebviewUrl();
    switch (provider.uiName) {
      case this.providers(account).Lido.name: {
        jestExpect(url).toContain(this.providers(account).Lido.url);
        break;
      }
      case this.providers(account).Stader_Labs.name: {
        jestExpect(url).toContain(account.currency.id);
        jestExpect(url).toContain(this.providers(account).Stader_Labs.url);
        jestExpect(url).toContain(account.address);
        break;
      }
      case this.providers(account).Kiln_staking_Pool.name: {
        jestExpect(url).toContain(account.currency.id);
        jestExpect(url).toContain(this.providers(account).Kiln_staking_Pool.url);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${provider.uiName}`);
    }
  }

  @Step("Verify rewards potential is visible")
  async verifyRewardsPotentials() {
    await waitWebElementByTestId(this.rewardsPotentialBalanceCard);
    const text = await getWebElementText(this.rewardsPotentialBalanceCard);
    jestExpect(normalizeText(text)).toContain(this.rewardsPotentialText);
  }

  @Step("Verify amount available to earn is visible")
  async verifyAmountAvailableToEarn() {
    await waitWebElementByTestId(this.amountAvailableToEarnBalanceCard);
    const text = await getWebElementText(this.amountAvailableToEarnBalanceCard);
    jestExpect(normalizeText(text)).toContain(this.amountAvailableAssetsText);
  }

  @Step("Verify total rewards earned is visible")
  async verifyTotalRewardsEarned() {
    await waitWebElementByTestId(this.totalRewardsBalanceCard);
    const text = await getWebElementText(this.totalRewardsBalanceCard);
    jestExpect(normalizeText(text)).toContain(this.totalRewardsText);
  }

  @Step("Verify total deposited is visible")
  async verifyTotalDeposited() {
    await waitWebElementByTestId(this.totalDepositedBalanceCard);
    const text = await getWebElementText(this.totalDepositedBalanceCard);
    jestExpect(normalizeText(text)).toContain(this.totalDepositedText);
  }

  @Step("Verify 'available assets' is visible")
  async verifyAvailableAssets(account: Account) {
    const assetTitleElement = getWebElementByTestId(this.assetsTitleId, 0, "data-test-id");
    await detoxExpect(assetTitleElement).toExist();
    await detoxExpect(assetTitleElement).toHaveText(this.assetsTitleText(false));
    const rowsContent = await getWebElementsText(this.tableEarnMoreSelector);
    const normalizedText = normalizeText(rowsContent.join(" "));
    jestExpect(normalizedText).toContain(`${account.accountName} ${account.currency.ticker}`);
    const earnButton = getWebElementByCssSelector(this.earnButtonSelector);
    await detoxExpect(earnButton).toExist();
    await detoxExpect(earnButton).toHaveText("Earn");
  }

  @Step("Verify Deposited assets is visible")
  async verifyDepositedAssets(account: Account) {
    const assetTitleElement = getWebElementByTestId(this.assetsTitleId, 0, "data-test-id");
    await detoxExpect(assetTitleElement).toExist();
    await detoxExpect(assetTitleElement).toHaveText(this.assetsTitleText(true));

    const rowsContent = await getWebElementsText(this.tableRewardsEarnedSelector);
    jestExpect(normalizeText(rowsContent.join(" "))).toContain(
      `${account.accountName} ${account.currency.ticker}`,
    );
  }

  @Step("Go to $0 tab")
  async goToTab(tabName: "My Rewards" | "Earn Opportunities") {
    const tabTestId = tabName === "My Rewards" ? "tab-assets" : "tab-earn-more";
    try {
      const button = getWebElementByTestId(tabTestId, 0, "data-test-id");
      await tapWebElementByElement(button);
    } catch {
      console.log(`${tabName} tab is not visible`);
    }
  }

  @Step("Verify earn by stacking button is visible")
  async verifyEarnByStackingButton() {
    const earnButton = getWebElementByTestId(this.stakeCryptoAssetsButton, 0, "data-test-id");
    await scrollToWebElement(earnButton);
    await tapWebElementByElement(earnButton);
    await app.common.flushDetoxSyncQueue();
    await app.stake.verifyChooseAssetPage();
  }
}
