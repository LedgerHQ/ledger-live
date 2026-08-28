import { Step } from "jest-allure2-reporter/api";
import ContactDetailPage from "@e2e/page/wallet/contactDetail.page";

const DEFAULT_ME_CONTACT_NAME = "Me";

export default class ContactsPage {
  savedContactNameRegExp = /^contacts-saved-contact-.+-name$/;

  detail = new ContactDetailPage();

  addContactContentId = "contacts-add-contact-content";

  contactsContent = () => getElementById("contacts-content");
  meName = () => getElementById("contacts-me-name");
  meAddressCount = () => getElementById("contacts-me-address-count");
  addContactHeaderButton = () => getElementById("contacts-add-contact-header");
  addContactRow = () => getElementById("contacts-add-contact-row");
  addContactNameInput = () => getElementById("contacts-add-contact-name-input");
  addContactSaveButton = () => getElementById("contacts-add-contact-save");
  savedContactName = (name: string) => getElementByIdAndText(this.savedContactNameRegExp, name);
  savedContactRow = (rowId: string) => getElementById(rowId);
  savedContactRowName = (rowId: string) => getElementById(`${rowId}-name`);
  savedContactAddressCount = (rowId: string) => getElementById(`${rowId}-address-count`);

  @Step("Expect Contacts screen visible")
  async expectScreenVisible() {
    await detoxExpect(this.contactsContent()).toBeVisible();
  }

  @Step("Expect Me contact displayed")
  async expectMeContactDisplayed() {
    await detoxExpect(this.meName()).toHaveText(DEFAULT_ME_CONTACT_NAME);
  }

  @Step("Expect Me contact address count to show {{0}}")
  async expectMeAddressCount(expectedLabel: string) {
    await detoxExpect(this.meAddressCount()).toHaveText(expectedLabel);
  }

  @Step("Open the Add contact drawer")
  async openAddContactDrawer() {
    await tapByElement(this.addContactHeaderButton());
    await waitForFullyVisibleById(this.addContactContentId);
  }

  @Step("Add the contact {{0}}")
  async addContact(name: string) {
    await this.openAddContactDrawer();
    await typeTextByElement(this.addContactNameInput(), name);
    await tapByElement(this.addContactSaveButton());
  }

  /** Rows carry a runtime uuid, so the id is resolved from the name label. Names are unique. */
  async getSavedContactRowId(name: string): Promise<string> {
    const nameId = await getIdOfElement(this.savedContactName(name));

    return nameId.replace(/-name$/, "");
  }

  @Step("Expect contact {{0}} displayed")
  async expectSavedContactDisplayed(name: string) {
    await detoxExpect(this.savedContactName(name)).toBeVisible();
  }

  @Step("Expect contact {{0}} address count to show {{1}}")
  async expectSavedContactAddressCount(name: string, expectedLabel: string) {
    const rowId = await this.getSavedContactRowId(name);

    await detoxExpect(this.savedContactAddressCount(rowId)).toHaveText(expectedLabel);
  }

  @Step("Open the contact row {{0}}")
  async openSavedContact(rowId: string) {
    await tapByElement(this.savedContactRow(rowId));
    await this.detail.expectScreenVisible();
  }

  @Step("Delete contact {{0}}")
  async deleteContact(rowId: string) {
    await this.openSavedContact(rowId);
    await this.detail.deleteContact();
  }

  @Step("Expect contact row {{0}} to be named {{1}}")
  async expectSavedContactRowName(rowId: string, name: string) {
    await detoxExpect(this.savedContactRowName(rowId)).toHaveText(name);
  }

  @Step("Expect contact row {{0}} removed")
  async expectSavedContactRemoved(rowId: string) {
    await detoxExpect(this.savedContactRow(rowId)).not.toExist();
  }

  @Step("Expect the empty contacts list")
  async expectEmptyState() {
    await detoxExpect(this.addContactRow()).toBeVisible();
  }
}
