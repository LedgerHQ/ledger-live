import { expect, type Page } from "@playwright/test";
import { Dialog } from "tests/component/dialog.component";
import { step } from "tests/misc/reporters/step";

export const ADD_CONTACT_PREFIX = "contacts-add-contact";
export const RENAME_CONTACT_PREFIX = "contacts-rename-contact";

export type ContactNameDialogPrefix = typeof ADD_CONTACT_PREFIX | typeof RENAME_CONTACT_PREFIX;

export class ContactNameDialog extends Dialog {
  constructor(
    page: Page,
    private readonly testIDPrefix: ContactNameDialogPrefix,
    private readonly confirmTestId: string,
  ) {
    super(page);
  }

  private get dialog() {
    return this.page.getByTestId(`${this.testIDPrefix}-dialog`);
  }

  private get nameInput() {
    return this.dialog.getByTestId(`${this.testIDPrefix}-name-input`);
  }

  private get confirmButton() {
    return this.dialog.getByTestId(this.confirmTestId);
  }

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
