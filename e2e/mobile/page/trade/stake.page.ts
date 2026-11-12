import { Step } from "jest-allure2-reporter/api";
import invariant from "invariant";
import { byId } from "@e2e/helpers/elements/native";

const PROVIDER_ROW_PREFIX = "provider-row-";
const PROVIDER_ROW_REGEX = new RegExp(`^${PROVIDER_ROW_PREFIX}.+$`);

export default class StakePage {
  private readonly searchPoolInput = byId("delegation-search-pool-input");
  private readonly anyProviderRow = byId(PROVIDER_ROW_REGEX);
  private readonly celoLockAmountInput = byId("celo-lock-amount-input");
  private readonly celoVoteAmount = byId("celo-vote-amount");
  private readonly celoVoteAmountInput = byId("celo-vote-amount-input");
  private readonly celoVoteAmountContinueButton = byId("enabled-celo-vote-amount-continue");
  private readonly celoVoteSummaryContinueButton = byId("enabled-celo-vote-summary-continue");
  private readonly providerRow = (providerTicker: string) =>
    byId(`${PROVIDER_ROW_PREFIX}${providerTicker}`);
  private readonly summaryValidator = (currencyId: string) =>
    byId(`${currencyId}-delegation-summary-validator`);
  private readonly summaryAmount = (currencyId: string) =>
    byId(`${currencyId}-delegation-summary-amount`);
  private readonly summaryFees = (currencyId: string) =>
    byId(`${currencyId}-delegation-summary-fees`);
  private readonly summaryContinueButton = (currencyId: string) =>
    byId(`enabled-${currencyId}-summary-continue-button`);
  private readonly amountInput = (currencyId: string) =>
    byId(`${currencyId}-delegation-amount-input`);
  private readonly amountContinueButton = (currencyId: string) =>
    byId(`enabled-${currencyId}-delegation-amount-continue`);
  // Prefixed with enabled- or disabled-, or not at all, depending on the family.
  private readonly delegationStartButton = (currencyId: string) =>
    byId(new RegExp(`^((enabled|disabled)-)?${currencyId}-delegation-start-button$`));

  @Step("Click on start delegation button {{{0}}}")
  async delegationStart(currencyId: string) {
    await this.delegationStartButton(currencyId).tap();
    await this.summaryValidator(currencyId).waitVisible();
  }

  @Step("Dismiss delegation start page if displayed {{{0}}}")
  async dismissDelegationStart(currencyId: string) {
    if (await this.delegationStartButton(currencyId).isVisible()) {
      await this.delegationStart(currencyId);
    }
  }

  @Step("Set delegated amount {{{1}}} for {{{0}}}")
  async setAmount(currencyId: string, amount: string) {
    await this.summaryAmount(currencyId).tap();
    await this.amountInput(currencyId).replaceText(amount);
    await this.amountContinueButton(currencyId).waitVisible(); // Issue with RN75 : QAA-370
  }

  @Step("Expect provider {{{1}}} in summary")
  async expectProvider(currencyId: string, provider: string) {
    await this.summaryValidator(currencyId).expectTextContaining(provider);
  }

  @Step("Select new provider {{{1}}}")
  async selectValidator(currencyId: string, provider: string) {
    const ticker = provider.split(" - ")[0];
    await this.summaryValidator(currencyId).tap();
    await this.searchPoolInput.replaceText(ticker);
    await this.searchPoolInput.waitVisible();
    await this.providerRow(ticker).tap();
  }

  @Step("Select the first provider offered for {{{0}}}")
  async selectFirstValidator(currencyId: string): Promise<string> {
    await this.summaryValidator(currencyId).tap();
    const rowId = await this.anyProviderRow.getIdentifier();
    const provider = rowId.slice(PROVIDER_ROW_PREFIX.length);
    await this.providerRow(provider).tap();
    await this.summaryValidator(currencyId).waitVisible();
    return provider;
  }

  // Families whose flow opens on the validator list have no summary row to tap first.
  @Step("Select provider {{{0}}} from the validator list")
  async selectValidatorFromList(provider: string) {
    await this.searchPoolInput.replaceText(provider);
    await this.providerRow(provider).tap();
  }

  @Step("Verify fees visible in summary {{{0}}}")
  async verifyFeesVisible(currencyId: string) {
    await this.summaryFees(currencyId).expectVisible();
  }

  @Step("Get fees displayed in summary {{{0}}}")
  async getDisplayedFees(currencyId: string) {
    const fees = await this.summaryFees(currencyId).getText();
    invariant(fees, "Fees empty in summary");
    return fees;
  }

  @Step("Validate the amount entered {{{0}}}")
  async validateAmount(currencyId: string) {
    await this.amountContinueButton(currencyId).tap();
    if (currencyId !== Currency.CELO.id) {
      await this.summaryAmount(currencyId).waitVisible();
    }
  }

  @Step("Click on continue button in summary {{{0}}}")
  async summaryContinue(currencyId: string): Promise<void> {
    await this.summaryContinueButton(currencyId).tap();
  }

  @Step("Set Celo lock amount {{{0}}}")
  async setCeloLockAmount(amount: string) {
    await this.celoLockAmountInput.replaceText(amount);
  }

  @Step("Open CELO vote amount screen")
  async openCeloVoteAmount() {
    await this.celoVoteAmount.tap();
  }

  @Step("Set CELO vote amount {{{0}}}")
  async setCeloVoteAmount(amount: string) {
    await this.celoVoteAmountInput.replaceText(amount);
  }

  @Step("Validate CELO vote amount")
  async validateCeloVoteAmount() {
    await this.celoVoteAmountContinueButton.tap();
  }

  @Step("Continue from CELO vote summary")
  async celoVoteSummaryContinue() {
    await this.celoVoteSummaryContinueButton.tap();
  }
}
