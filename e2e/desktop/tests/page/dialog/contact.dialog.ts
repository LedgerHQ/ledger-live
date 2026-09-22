import { expect, type Locator } from "@playwright/test";
import { Dialog } from "tests/component/dialog.component";
import { step } from "tests/misc/reporters/step";

export abstract class ContactDialog extends Dialog {
  protected abstract readonly dialog: Locator;
  protected abstract readonly nameInput: Locator;
  protected abstract readonly confirmButton: Locator;

  @step("Expect the contact name dialog visible")
  async expectVisible() {
    await expect(this.dialog).toBeVisible();
    await expect(this.nameInput).toBeVisible();
  }

  @step("Type contact name: $0")
  async typeName(name: string) {
    await this.nameInput.fill(name);
  }

  @step("Confirm the contact name")
  async confirm() {
    await expect(this.confirmButton).toBeEnabled();
    await this.confirmButton.click();
    await expect(this.dialog).toBeHidden();
  }
}
