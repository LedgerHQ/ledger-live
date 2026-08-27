import { Step } from "jest-allure2-reporter/api";
import ContactNameDrawer, { RENAME_CONTACT_PREFIX } from "@e2e/page/drawer/contactName.drawer";

export default class ContactDetailPage {
  renameDrawer = new ContactNameDrawer(RENAME_CONTACT_PREFIX);

  screen = () => getElementById("contacts-detail-screen");
  name = () => getElementById("contacts-detail-name");
  emptyState = () => getElementById("contacts-detail-empty-state");
  actionsTrigger = () => getElementById("contacts-detail-actions-trigger");
  editAction = () => getElementById("contacts-detail-edit-action");
  deleteAction = () => getElementById("contacts-detail-delete-action");
  actionsMenuContentId = "contacts-detail-actions-menu";
  deleteContentId = "contacts-delete-contact-content";
  deleteConfirmButton = () => getElementById("contacts-delete-contact-confirm");

  @Step("Expect contact detail screen visible")
  async expectScreenVisible() {
    await detoxExpect(this.screen()).toBeVisible();
  }

  @Step("Expect contact detail name to be {{0}}")
  async expectName(name: string) {
    await detoxExpect(this.name()).toHaveText(name);
  }

  @Step("Expect the contact to have no address")
  async expectNoAddresses() {
    await detoxExpect(this.emptyState()).toBeVisible();
  }

  @Step("Open the contact actions menu")
  async openActionsMenu() {
    await tapByElement(this.actionsTrigger());
    await waitForFullyVisibleById(this.actionsMenuContentId);
  }

  @Step("Open the rename contact drawer")
  async openRenameDrawer() {
    await tapByElement(this.editAction());
    await this.renameDrawer.expectVisible();
  }

  @Step("Rename the contact to {{0}}")
  async renameContact(name: string) {
    await this.openActionsMenu();
    await this.openRenameDrawer();
    await this.renameDrawer.typeName(name);
    await this.renameDrawer.confirm();
  }

  @Step("Open the delete contact confirmation")
  async openDeleteConfirmation() {
    await tapByElement(this.deleteAction());
    await waitForFullyVisibleById(this.deleteContentId);
  }

  @Step("Confirm the contact deletion")
  async tapConfirmDelete() {
    await tapByElement(this.deleteConfirmButton());
  }

  @Step("Delete the contact")
  async deleteContact() {
    await this.openActionsMenu();
    await this.openDeleteConfirmation();
    await this.tapConfirmDelete();
  }
}
