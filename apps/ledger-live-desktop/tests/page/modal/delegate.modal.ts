import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class delegateModal extends Modal {
  private titleProvider = this.page.getByTestId("modal-provider-title");
  private delegateContinueButton = this.page.getByText("Continue");
  private rowProvider = this.page.getByTestId("modal-provider-row");
  private searchOpenButton = this.page.getByText("Show all");
  private searchCloseButton = this.page.getByText("Show less");
  private validatorList = this.page.getByTestId("validator-list");
  private inputSearchField = this.page.getByPlaceholder("Search by name or address...");
  private stakeProviderContainer = (stakeProviderID: string) =>
    this.page.getByTestId(`stake-provider-container-${stakeProviderID}`);
  private detailsButton = this.page.getByRole("button", { name: "View details" });

  @step("Get title provider")
  async getTitleProvider() {
    await this.titleProvider.waitFor();
    return await this.titleProvider.textContent();
  }

  @step("Verify provider is $0")
  async verifyProvider(provider: string) {
    const providerName = await this.getTitleProvider();
    if (providerName) {
      expect(providerName).toBe(provider);
    }
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

  @step("check selected provider is different from the previous one")
  async selectProvider(providerIndex: number) {
    const selectedfProvider = await this.titleProvider.nth(providerIndex).textContent();
    await this.rowProvider.nth(providerIndex).click();
    await this.searchCloseButton.click();
    if (selectedfProvider) {
      expect(await this.getTitleProvider()).toContain(selectedfProvider);
    }
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
