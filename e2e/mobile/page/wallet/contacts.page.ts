import { Step } from "jest-allure2-reporter/api";
import { byId, byIdAndText } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";
import ContactDetailPage from "@e2e/page/wallet/contactDetail.page";

const ME_CONTACT_DISPLAY_NAME = "My addresses (Me)";

export default class ContactsPage {
  private readonly savedContactNameRegExp = /^contacts-saved-contact-.+-name$/;

  detail = new ContactDetailPage();

  private readonly contactsContent = byId("contacts-content");
  private readonly meName = byId("contacts-me-name");
  private readonly meAddressCount = byId("contacts-me-address-count");
  private readonly addContactHeaderButton = byId("contacts-add-contact-header");
  private readonly addContactContent = byId("contacts-add-contact-content");
  private readonly addContactRow = byId("contacts-add-contact-row");
  private readonly addContactNameInput = byId("contacts-add-contact-name-input");
  private readonly addContactSaveButton = byId("contacts-add-contact-save");
  private readonly searchInput = byId("contacts-search-input");
  private readonly savedContactName = (name: string) =>
    byIdAndText({ id: this.savedContactNameRegExp, text: name });
  private readonly savedContactNameAtIndex = (index: number) =>
    byId(this.savedContactNameRegExp, index);
  private readonly savedContactRow = (rowId: string) => byId(rowId);
  private readonly savedContactRowName = (rowId: string) => byId(`${rowId}-name`);
  private readonly savedContactAddressCount = (rowId: string) => byId(`${rowId}-address-count`);

  @Step("Expect Contacts screen visible")
  async expectScreenVisible(timeout = TIMEOUT.medium) {
    await this.contactsContent.waitVisible(timeout);
    await this.contactsContent.expectVisible();
  }

  @Step("Expect Me contact displayed")
  async expectMeContactDisplayed() {
    await this.meName.expectText(ME_CONTACT_DISPLAY_NAME);
  }

  @Step("Expect Me contact hidden")
  async expectMeContactHidden() {
    await this.meName.expectNotExist();
  }

  @Step("Expect Me contact address count to show {{0}}")
  async expectMeAddressCount(expectedLabel: string) {
    await this.meAddressCount.expectText(expectedLabel);
  }

  @Step("Open the Add contact drawer")
  async openAddContactDrawer() {
    await this.addContactHeaderButton.tap();
    await this.addContactContent.waitFullyVisible();
  }

  @Step("Add the contact {{0}}")
  async addContact(name: string) {
    await this.openAddContactDrawer();
    // LIVE-37168 - save button should remain interactable when the keyboard is open
    await this.addContactNameInput.replaceTextKeepKeyboard(name);
    // Same sheet footer as the rename drawer: on Android the keyboard lifts the button out of its
    // container's layout box, so Detox measures it as not visible although it is drawn above the
    // keyboard.
    await this.addContactSaveButton.tapExisting();
  }

  /** Rows carry a runtime uuid, so the id is resolved from the name label. Names are unique. */
  @Step("Get row ID for saved contact {{0}}")
  async getSavedContactRowId(name: string): Promise<string> {
    const identifier = await this.savedContactName(name).getIdentifier();

    return identifier.replace(/-name$/, "");
  }

  @Step("Expect contact {{0}} displayed")
  async expectSavedContactDisplayed(name: string) {
    await this.savedContactName(name).expectVisible();
  }

  @Step("Expect contact {{0}} not displayed")
  async expectSavedContactNotDisplayed(name: string) {
    await this.savedContactName(name).expectNotExist();
  }

  @Step("Expect saved contacts in order")
  async expectSavedContactsInOrder(names: readonly string[]) {
    for (const [index, name] of names.entries()) {
      await this.savedContactNameAtIndex(index).expectText(name);
    }
  }

  @Step("Search contacts for {{0}}")
  async search(query: string) {
    await this.searchInput.replaceText(query);
  }

  @Step("Clear the contacts search")
  async clearSearch() {
    await this.searchInput.tap();
    await this.searchInput.clearText();
  }

  @Step("Expect contact {{0}} address count to show {{1}}")
  async expectSavedContactAddressCount(name: string, expectedLabel: string) {
    const rowId = await this.getSavedContactRowId(name);

    await this.savedContactAddressCount(rowId).expectText(expectedLabel);
  }

  @Step("Open the contact row {{0}}")
  async openSavedContact(rowId: string) {
    await this.savedContactRow(rowId).tap();
    await this.detail.expectScreenVisible();
  }

  @Step("Delete contact {{0}}")
  async deleteContact(rowId: string) {
    await this.openSavedContact(rowId);
    await this.detail.deleteContact();
  }

  @Step("Expect contact row {{0}} to be named {{1}}")
  async expectSavedContactRowName(rowId: string, name: string) {
    await this.savedContactRowName(rowId).expectText(name);
  }

  @Step("Expect contact row {{0}} removed")
  async expectSavedContactRemoved(rowId: string) {
    await this.savedContactRow(rowId).expectNotExist();
  }

  @Step("Expect the empty contacts list")
  async expectEmptyState() {
    await this.addContactRow.expectVisible();
  }
}
