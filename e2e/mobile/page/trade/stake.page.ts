import { expect } from "detox";
import invariant from "invariant";

export default class StakePage {
  celoLockAmountInputId = "celo-lock-amount-input";
  searchPoolInputId = "delegation-search-pool-input";

  // IDs stay as simple strings
  delegationSummaryValidatorId(currencyId: string): string {
    return `${currencyId}-delegation-summary-validator`;
  }

  delegationSummaryAmountId(currencyId: string): string {
    return `${currencyId}-delegation-summary-amount`;
  }

  delegationAmountInputId(currencyId: string): string {
    return `${currencyId}-delegation-amount-input`;
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

  providerRowId(providerTicker: string): string {
    return `provider-row-${providerTicker}`;
  }

  async delegationSummaryValidator(currencyId: string): Promise<string> {
    return await getTextOfElement(this.delegationSummaryValidatorId(currencyId));
  }

  @Step("Select currency in stake list")
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

  @Step("Validate the amount entered")
  async validateAmount(currencyId: string): Promise<void> {
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
  async setCeloLockAmount(amount: string): Promise<void> {
    await typeTextById(this.celoLockAmountInputId, amount);
  }
}
