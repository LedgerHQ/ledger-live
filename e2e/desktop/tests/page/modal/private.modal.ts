import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class PrivateModal extends Modal {
  private modalTitle = this.page.locator("text=Enable shielded");

  @step("Retrieve modal title")
  async expectModalVisibility() {
    await expect(this.modalTitle).toBeVisible();
  }
}
