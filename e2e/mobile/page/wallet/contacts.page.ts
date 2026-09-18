import { Step } from "jest-allure2-reporter/api";
import ContactDetailPage from "@e2e/page/wallet/contactDetail.page";

const ME_CONTACT_DISPLAY_NAME = "My addresses";

/** Roughly a screenful of contact rows, and the step size the scroller itself defaults to. */
const LIST_SCROLL_PIXELS = 300;

/** Only guards against a list that never advances; a seeded list needs a fraction of these. */
const MAX_LIST_SCROLLS = 10;

export default class ContactsPage {
  savedContactNameRegExp = /^contacts-saved-contact-.+-name$/;

  detail = new ContactDetailPage();

  addContactContentId = "contacts-add-contact-content";
  addContactSaveButtonId = "contacts-add-contact-save";
  searchInputId = "contacts-search-input";
  contactsListId = "contacts-list";

  contactsContent = () => getElementById("contacts-content");
  meName = () => getElementById("contacts-me-name");
  meAddressCount = () => getElementById("contacts-me-address-count");
  addContactHeaderButton = () => getElementById("contacts-add-contact-header");
  addContactRow = () => getElementById("contacts-add-contact-row");
  addContactNameInput = () => getElementById("contacts-add-contact-name-input");
  addContactSaveButton = () => getElementById(this.addContactSaveButtonId);
  searchInput = () => getElementById(this.searchInputId);
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
    await typeTextByElement(this.addContactNameInput(), name);
    await this.saveContact();
  }

  /** Leaves the keyboard up, so a caller can assert what stays reachable underneath it. */
  @Step("Type the contact name {{0}} and leave the keyboard open")
  async typeAddContactNameLeavingKeyboardOpen(name: string) {
    await typeTextByElement(this.addContactNameInput(), name, false);
  }

  @Step("Expect the Add contact name field to hold {{0}}")
  async expectAddContactName(name: string) {
    await detoxExpect(this.addContactNameInput()).toHaveText(name);
  }

  @Step("Expect the Add contact form fully visible")
  async expectAddContactContentFullyVisible() {
    await waitForFullyVisibleById(this.addContactContentId);
  }

  @Step("Expect the Add contact save action fully visible")
  async expectAddContactSaveFullyVisible() {
    await waitForFullyVisibleById(this.addContactSaveButtonId);
  }

  @Step("Save the contact")
  async saveContact() {
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

  @Step("Expect contact {{0}} not displayed")
  async expectSavedContactNotDisplayed(name: string) {
    await detoxExpect(this.savedContactName(name)).not.toExist();
  }

  /**
   * Asserts the saved contacts read as `names`, top to bottom.
   *
   * A virtualized list only mounts a window of rows, so the full order is rebuilt one screenful at
   * a time: every snapshot is ordered by on-screen position, and the walk only ever goes down, so a
   * row first seen in a later snapshot genuinely sits further down the list. Asserting the whole
   * rebuilt sequence — rather than each name in turn — is what makes a sorting regression fail.
   */
  @Step("Expect saved contacts in order")
  async expectSavedContactsInOrder(names: readonly string[]) {
    await scrollToText(names[0], this.contactsListId, undefined, "up");

    const renderedOrder: string[] = [];

    for (let scroll = 0; scroll <= MAX_LIST_SCROLLS; scroll++) {
      const rendered = await getTextsInScreenOrder(this.savedContactNameRegExp);
      renderedOrder.push(...rendered.filter(name => !renderedOrder.includes(name)));

      if (renderedOrder.length >= names.length) break;

      await scrollByPixels(this.contactsListId, LIST_SCROLL_PIXELS, "down");
    }

    jestExpect(renderedOrder).toEqual([...names]);
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
