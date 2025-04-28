import { expect } from "detox";
import invariant from "invariant";

export default class StakePage {
  // IDs stay as simple strings
  delegationSummaryValidatorId(currencyId: string): string {
    return `${currencyId}-delegation-summary-validator`;
  }

  delegationSummaryAmountId(currencyId: string): string {
    return `${currencyId}-delegation-summary-amount`;
  }

  assetsRemainingId(currencyId: string): string {
    return `${currencyId}-assets-remaining`;
  }

  delegatedRatioId(currencyId: string, delegatedPercent: number): string {
    return `${currencyId}-delegate-ratio-${delegatedPercent}%`;
  }

  delegationAmountInputId(currencyId: string): string {
    return `${currencyId}-delegation-amount-input`;
  }

  allAssetsUsedTextId(currencyId: string): string {
    return `${currencyId}-all-assets-used-text`;
  }

  delegationFeesId(currencyId: string): string {
    return `${currencyId}-delegation-summary-fees`;
  }

  summaryContinueButtonId(currencyId: string): string {
    return `${currencyId}-summary-continue-button`;
  }

  delegationStartButtonId(currencyId: string): string {
    return `${currencyId}-delegation-start-button`;
  }

  delegationAmountContinueId(currencyId: string): string {
    return `${currencyId}-delegation-amount-continue`;
  }

  currencyRowId(currencyId: string): string {
    return `currency-row-${currencyId}`;
  }

  celoLockAmountInputId = "celo-lock-amount-input";
  searchPoolInputId = "delegation-search-pool-input";

  providerRowId(providerTicker: string): string {
    return `provider-row-${providerTicker}`;
  }

  zeroAssetText = "0\u00a0ATOM";

  /** Helpers to read text */
  async delegationSummaryValidator(currencyId: string): Promise<string> {
    return await getTextOfElement(this.delegationSummaryValidatorId(currencyId));
  }

  async delegationAmountValue(currencyId: string): Promise<string> {
    return await getTextOfElement(this.delegationSummaryAmountId(currencyId));
  }

  async getFeesDisplayed(currencyId: string): Promise<string> {
    const fees = await getTextOfElement(this.delegationFeesId(currencyId));
    invariant(fees, "Fees empty in summary");
    return fees;
  }

  /** Actions */
  async selectCurrency(currencyId: string): Promise<void> {
    const id = this.currencyRowId(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Get fees displayed in summary")
  async getDisplayedFees(currencyId: string): Promise<string> {
    const fees = await getTextOfElement(this.delegationFeesId(currencyId));
    invariant(fees, "Fees empty in summary");
    return fees;
  }

  @Step("Click on start delegation button")
  async delegationStart(currencyId: string): Promise<void> {
    await tapById(this.delegationStartButtonId(currencyId));
    await waitForElementById(this.delegationSummaryValidatorId(currencyId));
  }

  @Step("Dismiss delegation start page if displayed")
  async dismissDelegationStart(currencyId: string): Promise<void> {
    if (await IsIdVisible(this.delegationStartButtonId(currencyId))) {
      await this.delegationStart(currencyId);
    }
  }

  @Step("Set delegated amount")
  async setAmount(currencyId: string, amount: string): Promise<void> {
    await waitForElementById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegationSummaryAmountId(currencyId));
    await typeTextById(this.delegationAmountInputId(currencyId), amount);
  }

  @Step("Set delegated amount percent")
  async setAmountPercent(currencyId: string, delegatedPercent: 25 | 50 | 75 | 100): Promise<void> {
    await waitForElementById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegatedRatioId(currencyId, delegatedPercent));
  }

  @Step("Expect provider in summary")
  async expectProvider(currencyId: string, provider: string): Promise<void> {
    const actual = await this.delegationSummaryValidator(currencyId);
    jestExpect(actual).toEqual(provider);
  }

  @Step("Select new provider")
  async selectValidator(currencyId: string, provider: string): Promise<void> {
    const ticker = provider.split(" - ")[0];
    await tapById(this.delegationSummaryValidatorId(currencyId));
    await typeTextById(this.searchPoolInputId, ticker);
    await waitForElementById(this.searchPoolInputId);
    await tapById(this.providerRowId(ticker));
  }

  @Step("Verify fees visible in summary")
  async verifyFeesVisible(currencyId: string): Promise<void> {
    const feesElem = await getElementById(this.delegationFeesId(currencyId));
    await expect(feesElem).toBeVisible();
  }

  @Step("Expect assets remaining after delegation")
  async expectRemainingAmount(
    currencyId: string,
    delegatedPercent: 25 | 50 | 75 | 100,
    remainingFormatted: string,
  ): Promise<void> {
    const max = delegatedPercent === 100;
    const id = max ? this.allAssetsUsedTextId(currencyId) : this.assetsRemainingId(currencyId);
    await waitForElementById(id);
    const text = max ? this.zeroAssetText : (await getTextOfElement(id)).split(": ")[1];
    jestExpect(text).toEqual(remainingFormatted);
  }

  @Step("Validate the amount entered")
  async validateAmount(currencyId: string): Promise<void> {
    await tapById(this.delegationAmountContinueId(currencyId));
    if (currencyId !== Currency.CELO.id) {
      await waitForElementById(this.delegationSummaryAmountId(currencyId));
    }
  }

  @Step("Expect delegated amount in summary")
  async expectDelegatedAmount(currencyId: string, delegatedFormatted: string): Promise<void> {
    const actual = await this.delegationAmountValue(currencyId);
    jestExpect(actual).toEqual(delegatedFormatted);
  }

  @Step("Click on continue button in summary")
  async summaryContinue(currencyId: string): Promise<void> {
    const id = this.summaryContinueButtonId(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Set Celo lock amount")
  async setCeloLockAmount(amount: string): Promise<void> {
    await typeTextById(this.celoLockAmountInputId, amount);
  }
}
