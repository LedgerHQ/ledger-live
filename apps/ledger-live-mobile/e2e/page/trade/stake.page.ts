import {
  getTextOfElement,
  IsIdVisible,
  tapById,
  typeTextById,
  waitForElementById,
} from "../../helpers";

export default class StakePage {
  delegationSummaryValidatorId = (currencyId: string) =>
    `${currencyId}-delegation-summary-validator`;
  delegationSummaryValidator = (currencyId: string) =>
    getTextOfElement(this.delegationSummaryValidatorId(currencyId));
  delegationSummaryAmountId = (currencyId: string) => `${currencyId}-delegation-summary-amount`;
  delegationAmountValue = (currencyId: string) =>
    getTextOfElement(this.delegationSummaryAmountId(currencyId));
  assetsRemainingId = (currencyId: string) => `${currencyId}-assets-remaining`;
  delegatedRatioId = (currencyId: string, delegatedPercent: number) =>
    `${currencyId}-delegate-ratio-${delegatedPercent}%`;
  delegationAmountInput = (currencyId: string) => `${currencyId}-delegation-amount-input`;
  allAssetsUsedText = (currencyId: string) => `${currencyId}-all-assets-used-text`;
  summaryContinueButtonId = (currencyId: string) => `${currencyId}-summary-continue-button`;
  delegationStartId = (currencyId: string) => `${currencyId}-delegation-start-button`;
  delegationAmountContinueId = (currencyId: string) => `${currencyId}-delegation-amount-continue`;
  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  zeroAssetText = "0\u00a0ATOM";

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
    await typeTextById(this.delegationAmountInput(currencyId), amount);
  }

  @Step("Set delegated amount percent")
  async setAmountPercent(currencyId: string, delegatedPercent: 25 | 50 | 75 | 100) {
    await waitForElementById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegationSummaryAmountId(currencyId));
    await tapById(this.delegatedRatioId(currencyId, delegatedPercent));
  }

  @Step("Expect provider in summary")
  async expectProvider(currencyId: string, provider: string) {
    expect(await this.delegationSummaryValidator(currencyId)).toEqual(provider);
  }

  @Step("Expect assets remaining after delegation")
  async expectRemainingAmount(
    currencyId: string,
    delegatedPercent: 25 | 50 | 75 | 100,
    remainingAmountFormated: string,
  ) {
    const max = delegatedPercent == 100;
    const id = max ? this.allAssetsUsedText(currencyId) : this.assetsRemainingId(currencyId);
    await waitForElementById(id);
    const assestsRemaining = max ? this.zeroAssetText : (await getTextOfElement(id)).split(": ")[1];

    expect(assestsRemaining).toEqual(remainingAmountFormated);
  }

  @Step("Validate the amount entered")
  async validateAmount(currencyId: string) {
    await tapById(this.delegationAmountContinueId(currencyId));
    await waitForElementById(this.delegationSummaryAmountId(currencyId));
  }

  @Step("Expect delegated amount in summary")
  async expectDelegatedAmount(currencyId: string, delegatedAmountFormated: string) {
    const assetsDelagated = await this.delegationAmountValue(currencyId);
    expect(assetsDelagated).toEqual(delegatedAmountFormated);
  }

  @Step("Click on continue button in summary")
  async summaryContinue(currencyId: string) {
    await tapById(this.summaryContinueButtonId(currencyId));
  }
}
