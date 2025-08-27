import { normalizeText } from "helpers/commonHelpers";
import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export default class EarnDashboardPage {
  stakingProviderModalTitle = "staking-provider-modal-title";
  amountAvailableToEarnBalanceCard = "Amount available to earn-balance-card";
  getAssetsPlaceholderHero = "get-assets-placeholder-hero";
  rewardsPotentialBalanceCard = "Rewards you could earn-balance-card";
  rewardsPotentialText = "Rewards you could earn";
  amountAvailableAssetsText = "Amount available to earn";
  stakeCryptoAssetsButton = "stake-crypto-assets-button";
  assetsTitleId = "assets-title-text";
  totalDepositedBalanceCard = "Total deposited-balance-card";
  totalDepositedText = "Total deposited";
  totalRewardsBalanceCard = "Total rewards-balance-card";
  totalRewardsText = "Total rewards";
  earnMoreRewardTabButton = "tab-earn-more";

  stakingProviderTitle = (providerName: string) => `staking-provider-${providerName}-title`;
  earnButton = (accountId?: string) => `stake-${accountId}-button`;
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

  @Step("Wait for Earn dashboard to be ready")
  async waitForEarnDashboardToBeReady(
    withStaking: boolean = false,
    withExistingAccounts: boolean = true,
  ) {
    if (!withExistingAccounts) {
      await waitWebElementByTestId(this.getAssetsPlaceholderHero);
    } else {
      if (withStaking) {
        await waitWebElementByTestId(this.totalDepositedBalanceCard);
      } else {
        await waitWebElementByTestId(this.amountAvailableToEarnBalanceCard);
      }
    }
  }

  @Step("Click on earn button")
  async clickEarnCurrencyButton(id: string) {
    const elem = getWebElementByTestId(this.earnButton(id), 0, "data-test-id");
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

  @Step("Verify 'your eligible assets' is visible")
  async verifyYourEligibleAssets(account: Account, id?: string) {
    const assetTitleElement = getWebElementByTestId(this.assetsTitleId, 0, "data-test-id");
    await detoxExpect(assetTitleElement).toExist();
    await detoxExpect(assetTitleElement).toHaveText(this.assetsTitleText(false));
    const rowsContent = await getWebElementsByCssSelector("tr");
    jestExpect(normalizeText(rowsContent[1])).toContain(
      `${account.accountName} ${account.currency.ticker}`,
    );
    const button = getWebElementByTestId(this.earnButton(id), 0, "data-test-id");
    await detoxExpect(button).toExist();
    await detoxExpect(button).toHaveText("Earn");
  }

  @Step("Verify Deposited assets is visible")
  async verifyDepositedAssets(account: Account) {
    const assetTitleElement = getWebElementByTestId(this.assetsTitleId, 0, "data-test-id");
    await detoxExpect(assetTitleElement).toExist();
    await detoxExpect(assetTitleElement).toHaveText(this.assetsTitleText(true));

    const rowsContent = await getWebElementsByCssSelector("tr");
    jestExpect(normalizeText(rowsContent[1])).toContain(
      `${account.accountName} ${account.currency.ticker}`,
    );
  }

  @Step("Go to earn more tab")
  async goToEarnMoreTab() {
    const button = getWebElementByTestId(this.earnMoreRewardTabButton, 0, "data-test-id");
    await tapWebElementByElement(button);
  }

  @Step("Verify earn by stacking button is visible")
  async verifyEarnByStackingButton() {
    const earnButton = getWebElementByTestId(this.stakeCryptoAssetsButton, 0, "data-test-id");
    await scrollToWebElement(earnButton);
    await tapWebElementByElement(earnButton);
    await app.stake.verifyChooseAssetPage();
  }
}
