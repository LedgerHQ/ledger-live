import { Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Modal extends Component {
  readonly container = this.page.locator(
    '[data-testid=modal-container][style*="opacity: 1"][style*="transform: scale(1)"]',
  );
  readonly title = this.page.getByTestId("modal-title");
  readonly content = this.page.getByTestId("modal-content");
  protected backdrop = this.page.getByTestId("modal-backdrop");
  readonly continueButton = this.page.getByRole("button", { name: "continue" });
  protected closeButton = this.page.getByTestId("modal-close-button");
  protected maxAmountCheckbox = this.page.getByTestId("modal-max-checkbox");

  constructor(page: any) {
    super(page);
  }

  @step("Click Continue button")
  async continue() {
    await this.continueButton.click();
  }

  @step("Close modal")
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

  async toggleMaxAmount() {
    await this.maxAmountCheckbox.click();
  }

  @step("Click Continue button")
  async continueAmountModal() {
    await this.continueButton.click();
  }

  async continueToSignTransaction() {
    await this.continueButton.click({ force: true });
  }

  async scrollUntilOptionIsDisplayed(dropdown: Locator, element: Locator) {
    let isVisible = await element.isVisible();

    while (!isVisible) {
      await dropdown.evaluate(node => {
        node.scrollBy(0, 50);
      });
      isVisible = await element.isVisible();
    }
  }
}
