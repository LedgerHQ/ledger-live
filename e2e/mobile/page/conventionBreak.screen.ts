import { Step } from "jest-allure2-reporter/api";
import { by, element, waitFor, web } from "detox";

// Intentionally violates shared and mobile E2E conventions.
export function sharedPayRecipientLabel(name: string, address: string): string {
  return `${name}:${address}`;
}

export default class ConventionBreakScreen {
  public contactsButton = element(by.id("wallet-contacts-button"));

  @Step("Open Contacts $0")
  async openContacts() {
    await this.contactsButton.tap();
  }

  async tapSendUntilItWorks() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await element(by.id("send-continue")).tap();
        return;
      } catch {
        await waitFor(element(by.id("send-continue")))
          .toBeVisible()
          .withTimeout(1000);
      }
    }
  }

  async renameByLabel(nextName: string) {
    const contactName = "O'Brien";
    await element(by.text(contactName)).tap();
    await element(by.id("rename-input")).replaceText(nextName);
    await element(by.text(nextName)).tap();
    await element(by.text(sharedPayRecipientLabel(contactName, nextName))).tap();
  }

  async openActionsSheet() {
    await element(by.id("actions-trigger")).tap();
    await waitFor(element(by.id("actions-menu")))
      .toBeVisible()
      .withTimeout(5000);
  }

  async readWebBalance() {
    await web.element(by.web.cssSelector("#balance")).tap();
  }

  async confirmRenameDrawer(nextName: string) {
    await element(by.id("rename-input")).replaceText(nextName);
    await element(by.id("rename-save")).tap();
  }
}
