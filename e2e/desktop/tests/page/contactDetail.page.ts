import { expect } from "@playwright/test";
import { AppPage } from "tests/page/abstractClasses";
import { ContactNameDialog, RENAME_CONTACT_PREFIX } from "tests/page/dialog/contactName.dialog";
import { step } from "tests/misc/reporters/step";

export class ContactDetailPage extends AppPage {
  readonly renameDialog = new ContactNameDialog(
    this.page,
    RENAME_CONTACT_PREFIX,
    "contacts-rename-contact-confirm",
  );

  private readonly screen = this.page.getByTestId("contacts-detail-screen");
  private readonly name = this.page.getByTestId("contacts-detail-name");
  private readonly emptyState = this.page.getByTestId("contacts-detail-empty-state");
  private readonly editAction = this.page.getByTestId("contacts-detail-edit-action");
  private readonly deleteAction = this.page.getByTestId("contacts-detail-delete-action");
  private readonly deleteDialog = this.page.getByTestId("contacts-delete-contact-dialog");
  private readonly deleteConfirmButton = this.page.getByTestId("contacts-delete-contact-confirm");

  @step("Expect contact detail screen visible")
  async expectScreenVisible() {
    await expect(this.screen).toBeVisible();
  }

  @step("Expect contact detail name to be $0")
  async expectName(name: string) {
    await expect(this.name).toHaveText(name);
  }

  @step("Expect the contact to have no address")
  async expectNoAddresses() {
    await expect(this.emptyState).toBeVisible();
  }

  @step("Open the rename contact dialog")
  async openRenameDialog() {
    await this.editAction.click();
    await this.renameDialog.expectVisible();
  }

  @step("Rename the contact to $0")
  async renameContact(name: string) {
    await this.openRenameDialog();
    await this.renameDialog.typeName(name);
    await this.renameDialog.confirm();
  }

  @step("Open the delete contact confirmation")
  async openDeleteConfirmation() {
    await this.deleteAction.click();
    await expect(this.deleteDialog).toBeVisible();
  }

  @step("Confirm the contact deletion")
  async tapConfirmDelete() {
    await this.deleteConfirmButton.click();
    await expect(this.deleteDialog).toBeHidden();
  }

  @step("Delete the contact")
  async deleteContact() {
    await this.openDeleteConfirmation();
    await this.tapConfirmDelete();
  }
}
