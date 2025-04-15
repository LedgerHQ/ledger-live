import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "../../misc/reporters/step";

export class DelegateModal extends Modal {
  private titleProvider = this.page.getByTestId("modal-provider-title");
  private rowProvider = this.page.getByTestId("modal-provider-row");
  private searchOpenButton = this.page.getByText("Show all");
  private searchCloseButton = this.page.getByText("Show less");
  private validatorList = this.page.getByTestId("validator-list");
  private inputSearchField = this.page.getByPlaceholder("Search by name or address...");
  private stakeProviderContainer = (stakeProviderID: string) =>
    this.page.getByTestId(`stake-provider-container-${stakeProviderID}`);
  private detailsButton = this.page.getByRole("button", { name: "View details" });
  private validatorTC = this.page.getByTestId("ledger-validator-tc");
  private validatorName = this.page.getByTestId("validator-name-label");
  private feesSummaryStep = this.page.getByTestId("fees-amount-step-summary");
  private successMessageLabel = this.page.getByTestId("success-message-label");
  readonly delegateToEarnRewardsButton = this.page.getByRole("button", {
    name: "Delegate to earn rewards",
  });
  private delegateStarterInfos = this.page.getByTestId("delegation-starter-infos");
  private delegateTezosProvider = this.page.getByTestId("validator-name-tezos");
  private warningBox = this.page.getByTestId("warning-box");
  private celoLockButton = this.page.getByTestId("celo-lock-button");
  private celoVoteButton = this.page.getByTestId("celo-vote-button");
  private celoActivateVoteButton = this.page.getByTestId("celo-activate-vote-button");
  private celoRevokeVoteButton = this.page.getByTestId("celo-revoke-vote-button");
  private celoUnlockButton = this.page.getByTestId("celo-unlock-button");
  private celoWithdrawButton = this.page.getByTestId("celo-withdraw-button");
  private lockInfoCeloWarning = this.page.getByTestId("lock-info-celo");
  private checkIcon = this.page
    .getByTestId("check-icon")
    .locator('path[fill]:not([fill="transparent"])');
  readonly spendableBanner = this.page.getByTestId("modal-spendable-banner");
  readonly cryptoAmountField = this.page.getByTestId("modal-amount-field");

  @step("Get title provider on row $0")
  async getTitleProvider(row: number): Promise<string> {
    await this.titleProvider.nth(row - 1).waitFor();
    const titleProvider = await this.titleProvider.nth(row - 1).textContent();
    expect(titleProvider).not.toBeNull();
    return titleProvider!;
  }

  @step("Get spendable banner value")
  async getSpendableBannerValue() {
    const amountValue = await this.spendableBanner.textContent();
    return parseInt(amountValue!.replace(/[^0-9.]/g, ""));
  }

  @step("Get crypto amount")
  async getCryptoAmount() {
    const valueAmount = await this.cryptoAmountField.inputValue();
    return parseInt(valueAmount);
  }

  @step("Verify first provider name is $0")
  async verifyFirstProviderName(provider: string) {
    const providerName = await this.getTitleProvider(1);
    expect(providerName).toBe(provider);
  }

  @step("Select provider on row $0")
  async selectProviderOnRow(row: number) {
    await this.selectProviderByName(await this.getTitleProvider(row));
  }

  @step("Select provider $0")
  async selectProviderByName(name: string) {
    const providerRow = this.rowProvider.filter({ hasText: name }).first();
    await providerRow.click({ position: { x: 10, y: 10 } }); // Prevent click on the title as it is a redirection
    await this.verifyContinueEnabled();
  }

  @step("Select provider on row $0")
  async verifyProvider(row: number) {
    const isCheckIconWithinRowProvider =
      (await this.rowProvider
        .nth(row - 1)
        .locator(this.checkIcon)
        .count()) > 0;
    expect(isCheckIconWithinRowProvider).toBe(true);
  }

  @step("Verify continue button is disabled")
  async verifyContinueDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }

  @step("Verify continue button is enabled")
  async verifyContinueEnabled() {
    await expect(this.continueButton).toBeEnabled();
  }

  @step("Verify provider TC contains $0")
  async verifyProviderTC(provider: string) {
    const providerTC = await this.validatorTC.textContent();
    expect(providerTC).toContain(provider);
  }

  @step("Click on search provider button")
  async openSearchProviderModal() {
    await this.searchOpenButton.click();
  }

  @step("Input provider is $0")
  async inputProvider(provider: string) {
    const providerTicker = provider.split(" - ")[0];
    await this.inputSearchField.fill(providerTicker);
  }

  @step("Get selected provider name ")
  async getSelectedProviderName() {
    const selectedProviderElement = this.rowProvider.filter({
      has: this.checkIcon,
    });
    return await selectedProviderElement.locator(this.titleProvider).textContent();
  }

  @step("Check selected provider is displayed when closing list")
  async closeProviderList(providerRow: number) {
    const selectedfProvider = await this.getTitleProvider(providerRow);
    await this.searchCloseButton.click();
    expect(await this.getSelectedProviderName()).toContain(selectedfProvider);
  }

  @step("Click on chosen stake provider $0")
  async chooseStakeProvider(stakeProvider: string) {
    await this.stakeProviderContainer(stakeProvider).click();
  }

  @step("Click on view details button")
  async clickViewDetailsButton() {
    await this.detailsButton.click();
  }

  @step("check validator list is visible")
  async checkValidatorListIsVisible() {
    await expect(this.validatorList).toBeVisible();
  }

  @step("Fill amount")
  async fillAmount(amount: string) {
    if (amount == "send max") {
      await this.toggleMaxAmount();
    } else {
      await this.cryptoAmountField.fill(amount);
    }
  }

  @step("Verify success message")
  async verifySuccessMessage() {
    await expect(this.successMessageLabel).toBeVisible();
  }

  @step("Verify validator name is $0")
  async verifyValidatorName(validatorName: string) {
    const validator = await this.validatorName.allInnerTexts();
    expect(validator).toContain(validatorName);
  }

  @step("Verify fees summary step")
  async verifyFeesVisible() {
    await expect(this.feesSummaryStep).toBeVisible();
  }

  @step("Click on delegate to earn rewards button")
  async clickDelegateToEarnRewardsButton() {
    await expect(this.delegateStarterInfos).toBeVisible();
    await this.delegateToEarnRewardsButton.click();
  }

  @step("Verify delegate infos for $0")
  async verifyTezosDelegateInfos(validator: string) {
    await expect(this.delegateTezosProvider).toBeVisible();
    expect(await this.delegateTezosProvider.innerText()).toContain(validator);
    await expect(this.warningBox).toBeVisible();
  }

  @step("Verify Celo manage asset modal is visible")
  async checkCeloManageAssetModal() {
    await expect(this.celoLockButton).toBeVisible();
    await expect(this.celoVoteButton).toBeVisible();
    await expect(this.celoActivateVoteButton).toBeVisible();
    await expect(this.celoRevokeVoteButton).toBeVisible();
    await expect(this.celoUnlockButton).toBeVisible();
    await expect(this.celoWithdrawButton).toBeVisible();
  }

  @step("Click on lock button for CELO")
  async clickCeloLockButton() {
    await this.celoLockButton.click();
  }

  @step("Check alert message is visible when locking CELO")
  async verifyLockInfoCeloWarning() {
    await expect(this.lockInfoCeloWarning).toBeVisible();
  }
}
