import { expect } from "@playwright/test";
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

  @step("Click Continue button")
  async continue() {
    await this.continueButton.click();
  }

  @step("Close modal")
  async close() {
    await this.closeButton.click();
  }

  @step("Wait for modal to appear")
  async waitForModalToAppear() {
    await this.container.waitFor({ state: "attached" });
    await this.backdrop.waitFor({ state: "attached" });
  }

  @step("Wait for modal to disappear")
  async waitForModalToDisappear() {
    await this.container.waitFor({ state: "detached" });
  }

  @step("Toggle Max Amount")
  async toggleMaxAmount() {
    await this.maxAmountCheckbox.click();
  }

  @step("Continue to sign transaction")
  async continueToSignTransaction() {
    await this.continueButton.click();
  }

  @step("Continue is disabled")
  async continueIsDisabled() {
    expect(await this.continueButton.isDisabled()).toBe(true);
  }
}
