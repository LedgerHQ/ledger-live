import { Step } from "jest-allure2-reporter/api";

export const RENAME_CONTACT_PREFIX = "contacts-rename-contact";

export type ContactNameDrawerPrefix = typeof RENAME_CONTACT_PREFIX;

/** The shared `ContactsContactNameDrawerContent`, namespaced by its host's test id prefix. */
export default class ContactNameDrawer {
  constructor(private readonly testIDPrefix: ContactNameDrawerPrefix) {}

  private readonly contentId = () => `${this.testIDPrefix}-content`;

  private readonly nameInput = () => getElementById(`${this.testIDPrefix}-name-input`);
  private readonly confirmButton = () => getElementById(`${this.testIDPrefix}-confirm`);

  @Step("Expect the contact name drawer visible")
  async expectVisible() {
    await waitForFullyVisibleById(this.contentId());
  }

  @Step("Type contact name: {{0}} and confirm")
  async typeAndConfirm(name: string) {
    // LIVE-37168 - confirm button should remain interactable when the keyboard is open
    await typeTextByElement(this.nameInput(), name, false);
    await tapByElement(this.confirmButton());
  }
}
