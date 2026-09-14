import { expect } from "@playwright/test";
import { AppPage } from "tests/page/abstractClasses";
import { ContactDetailPage } from "tests/page/contactDetail.page";
import { ADD_CONTACT_PREFIX, ContactNameDialog } from "tests/page/dialog/contactName.dialog";
import { step } from "tests/misc/reporters/step";

const ME_CONTACT_DISPLAY_NAME = "My addresses";
const SAVED_CONTACT_NAME_TEST_ID = /^contacts-saved-contact-.+-name$/;

export class ContactsPage extends AppPage {
  readonly detail = new ContactDetailPage(this.page);
  readonly addContactDialog = new ContactNameDialog(
    this.page,
    ADD_CONTACT_PREFIX,
    "contacts-add-contact-save",
  );

  private readonly pageRoot = this.page.getByTestId("contacts-page");
  private readonly meName = this.page.getByTestId("contacts-me-name");
  private readonly meAddressCount = this.page.getByTestId("contacts-me-address-count");
  private readonly addContactHeaderButton = this.page.getByTestId("contacts-add-contact-header");
  private readonly addContactRow = this.page.getByTestId("contacts-add-contact");
  private readonly savedContactRows = this.page.getByTestId(/^contacts-saved-row-/);

  private savedContactName(name: string) {
    return this.page.getByTestId(SAVED_CONTACT_NAME_TEST_ID).filter({ hasText: name });
  }

  private savedContactRow(contactId: string) {
    return this.page.getByTestId(`contacts-saved-row-${contactId}`);
  }

  private savedContactRowName(contactId: string) {
    return this.page.getByTestId(`contacts-saved-contact-${contactId}-name`);
  }

  private savedContactAddressCount(contactId: string) {
    return this.page.getByTestId(`contacts-saved-contact-${contactId}-address-count`);
  }

  @step("Expect Contacts screen visible")
  async expectScreenVisible() {
    await expect(this.pageRoot).toBeVisible();
  }

  @step("Expect Me contact displayed")
  async expectMeContactDisplayed() {
    await expect(this.meName).toHaveText(ME_CONTACT_DISPLAY_NAME);
  }

  @step("Expect Me contact address count to show $0")
  async expectMeAddressCount(expectedLabel: string) {
    await expect(this.meAddressCount).toHaveText(expectedLabel);
  }

  @step("Open the Add contact dialog")
  async openAddContactDialog() {
    await this.addContactHeaderButton.click();
    await this.addContactDialog.expectVisible();
  }

  @step("Add the contact $0")
  async addContact(name: string) {
    await this.openAddContactDialog();
    await this.addContactDialog.typeName(name);
    await this.addContactDialog.confirm();
  }

  async getSavedContactId(name: string): Promise<string> {
    const nameLocator = this.savedContactName(name);
    await expect(nameLocator).toBeVisible();
    const nameId = await nameLocator.getAttribute("data-testid");
    if (!nameId) {
      throw new Error(`Saved contact row for ${name} should expose a test id`);
    }
    return nameId.replace(/^contacts-saved-contact-/, "").replace(/-name$/, "");
  }

  @step("Expect contact $0 displayed")
  async expectSavedContactDisplayed(name: string) {
    await expect(this.savedContactName(name)).toBeVisible();
  }

  @step("Expect contact $0 address count to show $1")
  async expectSavedContactAddressCount(name: string, expectedLabel: string) {
    const contactId = await this.getSavedContactId(name);
    await expect(this.savedContactAddressCount(contactId)).toHaveText(expectedLabel);
  }

  @step("Open the contact row $0")
  async openSavedContact(contactId: string) {
    await this.savedContactRow(contactId).click();
    await this.detail.expectScreenVisible();
  }

  @step("Delete contact $0")
  async deleteContact(contactId: string) {
    await this.openSavedContact(contactId);
    await this.detail.deleteContact();
  }

  @step("Expect contact row $0 to be named $1")
  async expectSavedContactRowName(contactId: string, name: string) {
    await expect(this.savedContactRowName(contactId)).toHaveText(name);
  }

  @step("Expect contact row $0 removed")
  async expectSavedContactRemoved(contactId: string) {
    await expect(this.savedContactRow(contactId)).toHaveCount(0);
  }

  @step("Expect the empty contacts list")
  async expectEmptyState() {
    await expect(this.addContactRow).toBeVisible();
    await expect(this.savedContactRows).toHaveCount(0);
  }
}
