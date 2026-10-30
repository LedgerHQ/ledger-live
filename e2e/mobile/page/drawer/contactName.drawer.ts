import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

/** The bottom sheet that renames a contact. */
export default class ContactNameDrawer {
  private readonly content = byId("contacts-rename-contact-content");
  private readonly nameInput = byId("contacts-rename-contact-name-input");
  private readonly confirmButton = byId("contacts-rename-contact-confirm");

  @Step("Expect the contact name drawer visible")
  async expectVisible() {
    await this.content.waitFullyVisible();
  }

  @Step("Type contact name: {{0}} and confirm")
  async typeAndConfirm(name: string) {
    // LIVE-37168 - confirm button should remain interactable when the keyboard is open
    await this.nameInput.replaceTextKeepKeyboard(name);
    await this.confirmButton.tap();
  }
}
