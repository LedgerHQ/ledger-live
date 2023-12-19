import { getTextOfElement, tapById, waitForElementById } from "../../helpers";

export default class StakePage {
  cosmosDelegationSummaryValidatorId = "cosmos-delegation-summary-validator";
  cosmosDelegationSummaryValidator = () => getTextOfElement("cosmos-delegation-summary-validator");
  cosmosDelegationSummaryAmountId = "cosmos-delegation-summary-amount";
  cosmosDelegationAmountValue = () => getTextOfElement(this.cosmosDelegationSummaryAmountId);
  cosmosAssestsRemainingId = "cosmos-assets-remaining";
  cosmosDelegatedRatioId = (delegatedPercent: number) => `delegate-ratio-${delegatedPercent}%`;
  cosmosAllAssestsUsedText = "cosmos-all-assets-used-text";
  summaryContinueButtonId = "cosmos-summary-continue-button";

  async selectCurrency(currencyId: string) {
    const id = "currency-row-" + currencyId;
    await waitForElementById(id);
    await tapById(id);
  }

  async selectAccount(accountId: string) {
    const id = "account-card-" + accountId;
    await waitForElementById(id);
    await tapById(id);
  }

  async delegationStart() {
    await tapById("cosmos-delegation-start-button");
    await waitForElementById(this.cosmosDelegationSummaryValidatorId);
  }

  async setAmount(delegatedPercent: 25 | 50 | 75 | 100) {
    await waitForElementById(this.cosmosDelegationSummaryAmountId);
    await tapById(this.cosmosDelegationSummaryAmountId);
    await tapById(this.cosmosDelegatedRatioId(delegatedPercent));
    const max = delegatedPercent == 100;
    const id = max ? this.cosmosAllAssestsUsedText : this.cosmosAssestsRemainingId;
    await waitForElementById(id);
    const assestsRemaining = max ? "0\u00a0ATOM" : (await getTextOfElement(id)).split(": ")[1];
    await tapById("cosmos-delegation-amount-continue");
    await waitForElementById(this.cosmosDelegationSummaryAmountId);
    const assestsDelagated = await this.cosmosDelegationAmountValue();
    return [assestsDelagated, assestsRemaining];
  }

  async summaryContinue() {
    await tapById(this.summaryContinueButtonId);
  }

  async successClose() {
    await waitForElementById("success-close-button");
    await tapById("success-close-button");
  }
}
