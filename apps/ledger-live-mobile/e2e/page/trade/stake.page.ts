import { getTextOfElement, tapById, waitForElementById } from "../../helpers";

export default class StakePage {
  cosmosDelegationSummaryValidatorId = "cosmos-delegation-summary-validator";
  cosmosDelegationSummaryValidator = () => getTextOfElement("cosmos-delegation-summary-validator");
  cosmosDelegationSummaryAmountId = "cosmos-delegation-summary-amount";
  cosmosDelegationAmountValue = () => getTextOfElement(this.cosmosDelegationSummaryAmountId);
  cosmosAssestsRemainingId = "cosmos-assets-remaining";
  cosmosDelegatedRatioId = (delegatedPercent: number) => `delegate-ratio-${delegatedPercent}%`;
  cosmosAllAssestsUsedText = "cosmos-all-assets-used-text";
  cosmosSummaryContinueButtonId = "cosmos-summary-continue-button";
  cosmosDelegationStartId = "cosmos-delegation-start-button";
  cosmosDelegationAmountContinueId = "cosmos-delegation-amount-continue";
  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  zeroAssetText = "0\u00a0ATOM";

  async selectCurrency(currencyId: string) {
    const id = this.currencyRow(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  async delegationStart() {
    await tapById(this.cosmosDelegationStartId);
    await waitForElementById(this.cosmosDelegationSummaryValidatorId);
  }

  async setAmount(delegatedPercent: 25 | 50 | 75 | 100) {
    await waitForElementById(this.cosmosDelegationSummaryAmountId);
    await tapById(this.cosmosDelegationSummaryAmountId);
    await tapById(this.cosmosDelegatedRatioId(delegatedPercent));
  }

  async expectValidator(validator: string) {
    expect(await this.cosmosDelegationSummaryValidator()).toEqual(validator);
  }

  async expectRemainingAmount(
    delegatedPercent: 25 | 50 | 75 | 100,
    remainingAmountFormated: string,
  ) {
    const max = delegatedPercent == 100;
    const id = max ? this.cosmosAllAssestsUsedText : this.cosmosAssestsRemainingId;
    await waitForElementById(id);
    const assestsRemaining = max ? this.zeroAssetText : (await getTextOfElement(id)).split(": ")[1];

    expect(assestsRemaining).toEqual(remainingAmountFormated);
  }

  async validateAmount() {
    await tapById(this.cosmosDelegationAmountContinueId);
    await waitForElementById(this.cosmosDelegationSummaryAmountId);
  }

  async expectDelegatedAmount(delegatedAmountFormated: string) {
    const assestsDelagated = await this.cosmosDelegationAmountValue();
    expect(assestsDelagated).toEqual(delegatedAmountFormated);
  }

  async summaryContinue() {
    await tapById(this.cosmosSummaryContinueButtonId);
  }
}
