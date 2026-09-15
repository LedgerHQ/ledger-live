import { Step } from "jest-allure2-reporter/api";

export const RENAME_CONTACT_PREFIX = "contacts-rename-contact";

export type ContactNameDrawerPrefix = typeof RENAME_CONTACT_PREFIX;

/** The shared `ContactsContactNameDrawerContent`, namespaced by its host's test id prefix. */
export default class ContactNameDrawer {
  constructor(private readonly testIDPrefix: ContactNameDrawerPrefix) {}

  contentId = () => `${this.testIDPrefix}-content`;
  confirmButtonId = () => `${this.testIDPrefix}-confirm`;

  content = () => getElementById(this.contentId());
  nameInput = () => getElementById(`${this.testIDPrefix}-name-input`);
  confirmButton = () => getElementById(this.confirmButtonId());

  @Step("Expect the contact name drawer visible")
  async expectVisible() {
    await waitForFullyVisibleById(this.contentId());
  }

  @Step("Type contact name: {{0}}")
  async typeName(name: string) {
    await typeTextByElement(this.nameInput(), name);
  }

  /** Leaves the keyboard up, so a caller can assert what stays reachable underneath it. */
  @Step("Type contact name {{0}} and leave the keyboard open")
  async typeNameLeavingKeyboardOpen(name: string) {
    await typeTextByElement(this.nameInput(), name, false);
  }

  @Step("Expect the name field to hold {{0}}")
  async expectName(name: string) {
    await detoxExpect(this.nameInput()).toHaveText(name);
  }

  @Step("Expect the confirm action fully visible")
  async expectConfirmFullyVisible() {
    await waitForFullyVisibleById(this.confirmButtonId());
  }

  @Step("Confirm the contact name")
  async confirm() {
    await tapByElement(this.confirmButton());
  }
}
