import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class delegateModal extends Modal {
  private titleProvider = this.page.getByTestId("modal-provider-title");
  private sideInfoProvider = this.page.getByTestId("modal-provider-side-info");
  private delegateContinueButton = this.page.getByText("Continue");
  private rowProvider = this.page.getByTestId("modal-provider-row");
  private searchOpenButton = this.page.getByText("Show all");
  private searchCloseButton = this.page.getByText("Show less");
  private validatorList = this.page.getByTestId("validator-list");
  private inputSearchField = this.page.getByPlaceholder("Search by name or address...");
  private stakeProviderContainer = (stakeProviderID: string) =>
    this.page.getByTestId(`stake-provider-container-${stakeProviderID}`);
  private detailsButton = this.page.getByRole("button", { name: "View details" });
  private validatorTC = this.page.getByTestId("ledger-validator-tc");
  private checkIcon = this.page.getByTestId("check-icon");

  @step("Get title provider on row $0")
  async getTitleProvider(row: number) {
    await this.titleProvider.nth(row - 1).waitFor();
    return await this.titleProvider.nth(row - 1).textContent();
  }

  @step("Verify first provider name")
  async verifyFirstProviderName(provider: string) {
    const providerName = await this.getTitleProvider(1);
    expect(providerName).toBe(provider);
  }

  @step("Select provider on row $0")
  async selectProvider(row: number) {
    this.rowProvider.nth(row - 1).click();
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
    await expect(this.delegateContinueButton).toBeDisabled();
  }

  @step("Verify continue button is enabled")
  async verifyContinueEnabled() {
    await expect(this.delegateContinueButton).toBeEnabled();
  }

  @step("Verify provider TC contains $0")
  async verifyProviderTC(provider: string) {
    const providerTC = await this.validatorTC.textContent();
    expect(providerTC).toContain(provider);
  }

  @step("Click on continue button - delegate")
  async continueDelegate() {
    await this.delegateContinueButton.click();
  }

  @step("Click on search provider button")
  async openSearchProviderModal() {
    await this.searchOpenButton.click();
  }

  @step("Input provider is $0")
  async inputProvider(provider: string) {
    await this.inputSearchField.fill(provider);
  }

  @step("Check selected provider is displayed when closing list")
  async closeProviderList(providerRow: number) {
    const selectedfProvider = await this.getTitleProvider(providerRow);
    await this.searchCloseButton.click();
    expect(await this.getTitleProvider(1)).toContain(selectedfProvider);
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
}
