import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class delegateModal extends Modal {
  private titleProvider = this.page.getByTestId("modal-provider-title");
  private delegateContinueButton = this.page.locator("id=delegate-continue-button");
  private rowProvider = this.page.getByTestId("modal-provider-row");
  private searchOpenButton = this.page.getByText("Show all");
  private searchCloseButton = this.page.getByText("Show less");
  private inputSearchField = this.page.getByPlaceholder("Search by name or address...");
  private stakeProviderContainer = (stakeProviderID: string) =>
    this.page.getByTestId(`stake-provider-container-${stakeProviderID}`);

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

  @step("Select provider is $0")
  async selectProvider(providerIndex: number) {
    await this.rowProvider.nth(providerIndex).click();
    await this.searchCloseButton.click();
  }

  @step("Click on chosen stake provider $0")
  async chooseStakeProvider(stakeProvider: string) {
    await this.stakeProviderContainer(stakeProvider).click();
  }
}
