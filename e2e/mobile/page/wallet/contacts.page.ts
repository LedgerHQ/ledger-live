import { Step } from "jest-allure2-reporter/api";
import { TIMEOUT } from "@e2e/utils/timeouts";
import ContactDetailPage from "@e2e/page/wallet/contactDetail.page";

const ME_CONTACT_DISPLAY_NAME = "My addresses (Me)";

export default class ContactsPage {
  private readonly savedContactNameRegExp = /^contacts-saved-contact-.+-name$/;

  detail = new ContactDetailPage();

  private readonly addContactContentId = "contacts-add-contact-content";
  private readonly searchInputId = "contacts-search-input";

  private readonly contactsContent = () => getElementById("contacts-content");
  private readonly meName = () => getElementById("contacts-me-name");
  private readonly meAddressCount = () => getElementById("contacts-me-address-count");
  private readonly addContactHeaderButton = () => getElementById("contacts-add-contact-header");
  private readonly addContactRow = () => getElementById("contacts-add-contact-row");
  private readonly addContactNameInput = () => getElementById("contacts-add-contact-name-input");
  private readonly addContactSaveButton = () => getElementById("contacts-add-contact-save");
  private readonly searchInput = () => getElementById(this.searchInputId);
  private readonly savedContactName = (name: string) =>
    getElementByIdAndText(this.savedContactNameRegExp, name);
  private readonly savedContactNameAtIndex = (index: number) =>
    getElementById(this.savedContactNameRegExp, index);
  private readonly savedContactRow = (rowId: string) => getElementById(rowId);
  private readonly savedContactRowName = (rowId: string) => getElementById(`${rowId}-name`);
  private readonly savedContactAddressCount = (rowId: string) =>
    getElementById(`${rowId}-address-count`);

  @Step("Expect Contacts screen visible")
  async expectScreenVisible(timeout = TIMEOUT.medium) {
    await waitForElement(this.contactsContent(), timeout);
    await detoxExpect(this.contactsContent()).toBeVisible();
  }

  @Step("Expect Me contact displayed")
  async expectMeContactDisplayed() {
    await detoxExpect(this.meName()).toHaveText(ME_CONTACT_DISPLAY_NAME);
  }

  @Step("Expect Me contact hidden")
  async expectMeContactHidden() {
    await detoxExpect(this.meName()).not.toExist();
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
    // LIVE-37168 - save button should remain interactable when the keyboard is open
    await typeTextByElement(this.addContactNameInput(), name, false);
    await tapByElement(this.addContactSaveButton());
  }

  /** Rows carry a runtime uuid, so the id is resolved from the name label. Names are unique. */
  @Step("Get row ID for saved contact {{0}}")
  async getSavedContactRowId(name: string): Promise<string> {
    const nameId = await getIdOfElement(this.savedContactName(name));

    return nameId.replace(/-name$/, "");
  }

  @Step("Expect contact {{0}} displayed")
  async expectSavedContactDisplayed(name: string) {
    await detoxExpect(this.savedContactName(name)).toBeVisible();
  }

  @Step("Expect contact {{0}} not displayed")
  async expectSavedContactNotDisplayed(name: string) {
    await detoxExpect(this.savedContactName(name)).not.toExist();
  }

  @Step("Expect saved contacts in order")
  async expectSavedContactsInOrder(names: readonly string[]) {
    for (const [index, name] of names.entries()) {
      await detoxExpect(this.savedContactNameAtIndex(index)).toHaveText(name);
    }
  }

  @Step("Search contacts for {{0}}")
  async search(query: string) {
    await waitForElementById(this.searchInputId);
    await typeTextByElement(this.searchInput(), query);
  }

  @Step("Clear the contacts search")
  async clearSearch() {
    await waitForElementById(this.searchInputId);
    await tapByElement(this.searchInput());
    await clearTextByElement(this.searchInput());
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
