import { Step } from "jest-allure2-reporter/api";

export const RENAME_CONTACT_PREFIX = "contacts-rename-contact";

export type ContactNameDrawerPrefix = typeof RENAME_CONTACT_PREFIX;

/** The shared `ContactsContactNameDrawerContent`, namespaced by its host's test id prefix. */
export default class ContactNameDrawer {
  constructor(private readonly testIDPrefix: ContactNameDrawerPrefix) {}

  contentId = () => `${this.testIDPrefix}-content`;

  content = () => getElementById(this.contentId());
  nameInput = () => getElementById(`${this.testIDPrefix}-name-input`);
  confirmButton = () => getElementById(`${this.testIDPrefix}-confirm`);

  @Step("Expect the contact name drawer visible")
  async expectVisible() {
    await waitForFullyVisibleById(this.contentId());
  }

  @Step("Type contact name: {{0}}")
  async typeName(name: string) {
    await typeTextByElement(this.nameInput(), name);
  }

  @Step("Confirm the contact name")
  async confirm() {
    await tapByElement(this.confirmButton());
  }
}
