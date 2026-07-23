import { Locator } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Modal extends Component {
  readonly container = this.page.locator(
    '[data-testid=modal-container][style*="opacity: 1"][style*="transform: scale(1)"]',
  );
  readonly title = this.container.getByTestId("modal-title");
  readonly content = this.container.getByTestId("modal-content");
  readonly continueButton = this.container.getByRole("button", { name: "continue" });

  protected backdrop = this.page.getByTestId("modal-backdrop");
  protected closeButton = this.container.getByTestId("modal-close-button");
  protected maxAmountCheckbox = this.container.getByTestId("modal-max-checkbox");

  @step("Click Continue button")
  async continue() {
    await this.continueButton.click();
  }

  @step("Close modal")
  async close() {
    await this.closeButton.click();
  }

  @step("Toggle Max Amount")
  async toggleMaxAmount() {
    await this.maxAmountCheckbox.click();
  }

  @step("Click Continue button")
  async continueAmountModal() {
    await this.continueButton.click();
  }

  @step("continue until option is displayed")
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
