import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class delegateModal extends Modal {
  private titleProvider = this.page.getByTestId("modal-provider-title");
  private rowProvider = this.page.getByTestId("modal-provider-row");
  private validatorList = this.page.getByTestId("validator-list");
  private searchOpenButton = this.page.getByText("Show all");
  private inputSearchField = this.page.getByPlaceholder("Search by name or address...");
  private stakeProviderContainer = (stakeProviderID: string) =>
    this.page.getByTestId(`stake-provider-container-${stakeProviderID}`);
  readonly spendableBanner = this.page.getByTestId("modal-spendable-banner");
  readonly cryptoAmountField = this.page.getByTestId("modal-amount-field");

  @step("Wait for validator list to be visible")
  async waitForValidatorListVisible() {
    await expect(this.validatorList).toBeVisible();
    await expect(this.rowProvider.first()).toBeVisible();
  }

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

  @step("Wait for crypto amount to be populated")
  async waitForCryptoAmountToBePopulated() {
    await expect(this.cryptoAmountField).not.toHaveValue("");
  }

  @step("Get crypto amount")
  async getCryptoAmount() {
    const valueAmount = await this.cryptoAmountField.inputValue();
    return parseInt(valueAmount);
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

  @step("Verify provider $0 is shown in the list")
  async verifyProviderIsShown(name: string) {
    await expect(this.rowProvider.filter({ hasText: name }).first()).toBeVisible();
  }

  @step("Verify continue button is enabled")
  async verifyContinueEnabled() {
    await expect(this.continueButton).toBeEnabled();
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

  @step("Click on chosen stake provider $0")
  async chooseStakeProvider(stakeProvider: string) {
    await this.stakeProviderContainer(stakeProvider).click();
  }
}
