import invariant from "invariant";

export default class StakePage {
  celoLockAmountInput = "celo-lock-amount-input";
  searchPoolInput = "delegation-search-pool-input";
  selectAssetTitle = "select-asset-drawer-title";

  madSearchBarId = "modular-drawer-search-input";

  delegationSummaryValidatorId = (currencyId: string) =>
    `${currencyId}-delegation-summary-validator`;
  delegationSummaryValidator = (currencyId: string) =>
    getTextOfElement(this.delegationSummaryValidatorId(currencyId));
  delegationSummaryAmountId = (currencyId: string) => `${currencyId}-delegation-summary-amount`;
  delegatedRatioId = (currencyId: string, delegatedPercent: number) =>
    `${currencyId}-delegate-ratio-${delegatedPercent}%`;
  delegationAmountInput = (currencyId: string) => `${currencyId}-delegation-amount-input`;
  delegationFees = (currencyId: string) => `${currencyId}-delegation-summary-fees`;
  summaryContinueButtonId = (currencyId: string) => `${currencyId}-summary-continue-button`;
  delegationStartId = (currencyId: string) => `${currencyId}-delegation-start-button`;
  delegationAmountContinueId = (currencyId: string) => `${currencyId}-delegation-amount-continue`;
  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  providerRow = (providerTicker: string) => `provider-row-${providerTicker}`;

  @Step("Select currency")
  async selectCurrency(currencyId: string) {
    const id = this.currencyRow(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Click on start delegation button")
  async delegationStart(currencyId: string) {
    await tapById(this.delegationStartId(currencyId));
    await waitForElementById(this.delegationSummaryValidatorId(currencyId));
  }

  @Step("Dismiss delegation start page if displayed")
  async dismissDelegationStart(currencyId: string) {
    if (await IsIdVisible(this.delegationStartId(currencyId))) {
      await this.delegationStart(currencyId);
    }
  }

  @Step("Set delegated amount")
  async setAmount(currencyId: string, amount: string) {
    await waitForElementById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegationSummaryAmountId(currencyId));
    await waitForElementById(this.delegationAmountInput(currencyId)); // Issue with RN75 : QAA-370
    await typeTextById(this.delegationAmountInput(currencyId), amount);
    await waitForElementById(this.delegationAmountContinueId(currencyId)); // Issue with RN75 : QAA-370
  }

  @Step("Set delegated amount percent")
  async setAmountPercent(currencyId: string, delegatedPercent: 25 | 50 | 75 | 100) {
    await waitForElementById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegatedRatioId(currencyId, delegatedPercent));
  }

  @Step("Expect provider in summary")
  async expectProvider(currencyId: string, provider: string) {
    jestExpect(await this.delegationSummaryValidator(currencyId)).toContain(provider);
  }

  @Step("Select new provider")
  async selectValidator(currencyId: string, provider: string) {
    const ticker = provider.split(" - ")[0];
    await tapById(this.delegationSummaryValidatorId(currencyId));
    await typeTextById(this.searchPoolInput, ticker);
    await waitForElementById(this.searchPoolInput);
    await tapById(this.providerRow(ticker));
  }

  @Step("Verify fees visible in summary")
  async verifyFeesVisible(currencyId: string) {
    await detoxExpect(getElementById(this.delegationFees(currencyId))).toBeVisible();
  }

  @Step("Get fees displayed in summary")
  async getDisplayedFees(currencyId: string) {
    const fees = getTextOfElement(this.delegationFees(currencyId));
    invariant(fees, "Fees empty in summary");
    return fees;
  }

  @Step("Validate the amount entered")
  async validateAmount(currencyId: string) {
    await tapById(this.delegationAmountContinueId(currencyId));
    if (currencyId !== Currency.CELO.id) {
      await waitForElementById(this.delegationSummaryAmountId(currencyId));
    }
  }

  @Step("Click on continue button in summary")
  async summaryContinue(currencyId: string): Promise<void> {
    const id = this.summaryContinueButtonId(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Set Celo lock amount")
  async setCeloLockAmount(amount: string) {
    await typeTextById(this.celoLockAmountInput, amount);
  }

  @Step("Verify choose asset page is visible")
  async verifyChooseAssetPage() {
    const isModularDrawer = await app.modularDrawer.isFlowEnabled("live_app");
    if (isModularDrawer) {
      await waitForElementById(this.madSearchBarId);
      await detoxExpect(getElementById(this.madSearchBarId)).toBeVisible();
    } else {
      await waitForElementById(this.selectAssetTitle);
      await detoxExpect(app.common.searchBar()).toBeVisible();
    }
  }
}
