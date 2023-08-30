import { Page, Locator } from "@playwright/test";

export class Modal {
  readonly page: Page;
  readonly container: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly content: Locator;
  readonly backdrop: Locator;
  readonly continueButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;
  readonly doneButton: Locator;
  readonly closeButton: Locator;
  readonly backButton: Locator;
  readonly titleProvider: Locator;
  readonly delegateContinueButton: Locator;
  readonly spendableBanner: Locator;
  readonly maxAmountCheckbox: Locator;
  readonly cryptoAmountField: Locator;
  readonly continueAmountButton: Locator;
  readonly searchOpenButton: Locator;
  readonly searchCloseButton: Locator;
  readonly inputSearchField: Locator;
  readonly rowProvider: Locator;
  readonly stakeProviderContainer: (stakeProvider: string) => Locator;
  readonly stakeProviderSupportLink: (stakeProvider: string) => Locator;
  readonly signNetworkWarning: Locator;
  readonly signContinueButton: Locator;
  readonly confirmText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator(
      '[data-test-id=modal-container][style*="opacity: 1"][style*="transform: scale(1)"]',
    );
    this.title = page.locator("data-test-id=modal-title");
    this.subtitle = page.locator("data-test-id=modal-subtitle");
    this.content = page.locator("data-test-id=modal-content");
    this.backdrop = page.locator("data-test-id=modal-backdrop");
    this.continueButton = page.locator("data-test-id=modal-continue-button");
    this.saveButton = page.locator("data-test-id=modal-save-button");
    this.cancelButton = page.locator("data-test-id=modal-cancel-button");
    this.confirmButton = page.locator("data-test-id=modal-confirm-button");
    this.doneButton = page.locator("data-test-id=modal-done-button");
    this.closeButton = page.locator("data-test-id=modal-close-button");
    this.backButton = page.locator("data-test-id=modal-back-button");
    this.titleProvider = page.locator("data-test-id=modal-provider-title");
    this.rowProvider = page.locator('[data-test-id="modal-provider-row"]');
    this.delegateContinueButton = page.locator("id=delegate-continue-button");
    this.spendableBanner = page.locator("data-test-id=modal-spendable-banner");
    this.maxAmountCheckbox = page.locator("data-test-id=modal-max-checkbox");
    this.cryptoAmountField = page.locator("data-test-id=modal-amount-field");
    this.continueAmountButton = page.locator("id=send-amount-continue-button");
    this.searchOpenButton = page.getByText("Show all");
    this.searchCloseButton = page.getByText("Show less");
    this.inputSearchField = page.getByPlaceholder("Search by name or address...");
    this.stakeProviderContainer = stakeProviderID =>
      page.locator(`data-test-id=stake-provider-container-${stakeProviderID}`);
    this.stakeProviderSupportLink = stakeProviderID =>
      page.locator(`data-test-id=stake-provider-support-link-${stakeProviderID}`);
    this.signNetworkWarning = page.locator("text=Network fees are above 10% of the amount").first();
    this.signContinueButton = page.locator("text=Continue");
    this.confirmText = page.locator(
      "text=Please confirm the operation on your device to finalize it",
    );
  }

  async continue() {
    await this.continueButton.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async done() {
    await this.doneButton.click();
  }

  async back() {
    await this.backButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async waitForModalToAppear() {
    await this.container.waitFor({ state: "attached" });
    await this.backdrop.waitFor({ state: "attached" });
  }

  async waitForModalToDisappear() {
    await this.container.waitFor({ state: "detached" });
  }

  async chooseStakeProvider(stakeProvider: string) {
    await this.stakeProviderContainer(stakeProvider).click();
  }

  async chooseStakeSupportLink(stakeProvider: string) {
    await this.stakeProviderSupportLink(stakeProvider).dispatchEvent("click");
  }

  async getTitleProvider() {
    await this.titleProvider.waitFor();
    const provider = await this.titleProvider.textContent();
    return provider;
  }

  async continueDelegate() {
    await this.delegateContinueButton.click();
  }

  async getSpendableBannerValue() {
    const amountValue = await this.spendableBanner.textContent();
    // removing non numerical values
    return parseInt(amountValue!.replace(/[^0-9.]/g, ""));
  }

  async toggleMaxAmount() {
    await this.maxAmountCheckbox.click();
  }

  async getCryptoAmount() {
    const valueAmount = await this.cryptoAmountField.inputValue();
    return parseInt(valueAmount);
  }

  async countinueSendAmount() {
    await this.continueAmountButton.click();
  }

  async openSearchProviderModal() {
    await this.searchOpenButton.click();
  }

  async inputProvider(provider: string) {
    await this.inputSearchField.fill(provider);
  }

  async selectProvider(providerIndex: number) {
    await this.rowProvider.nth(providerIndex).click();
    await this.searchCloseButton.click();
  }

  async continueToSignTransaction() {
    await this.signContinueButton.click({ force: true });
  }

  async waitForConfirmationScreenToBeDisplayed() {
    await this.confirmText.waitFor({ state: "visible" });
  }
}
