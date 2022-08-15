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
  readonly retryButton: Locator;
  readonly doneButton: Locator;
  readonly closeButton: Locator;
  readonly backButton: Locator;
  readonly loader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator(
      '[data-test-id=modal-container][style="opacity: 1; transform: scale(1);"]',
    );
    this.title = page.locator("data-test-id=modal-title");
    this.subtitle = page.locator("data-test-id=modal-subtitle");
    this.content = page.locator("data-test-id=modal-content");
    this.backdrop = page.locator("data-test-id=modal-backdrop");
    this.continueButton = page.locator("data-test-id=modal-continue-button");
    this.saveButton = page.locator("data-test-id=modal-save-button");
    this.cancelButton = page.locator("data-test-id=modal-cancel-button");
    this.confirmButton = page.locator("data-test-id=modal-confirm-button");
    this.retryButton = page.locator("data-test-id=modal-retry-button");
    this.doneButton = page.locator("data-test-id=modal-done-button");
    this.closeButton = page.locator("data-test-id=modal-close-button");
    this.backButton = page.locator("data-test-id=modal-back-button");
    this.loader = page.locator("data-test-id=device-action-loader"); // device action loader
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

  async retry() {
    await this.retryButton.click();
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

  async waitForModalToDisappear() {
    await this.container.waitFor({ state: "detached" });
  }

  async waitForDevice() {
    await this.loader.waitFor({ state: "hidden" });
    await this.page.waitForTimeout(1000); // extra time to let speculos load a new screen
  }
}
