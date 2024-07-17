import { Modal } from "tests/component/modal.component";

export class TermsModal extends Modal {
  private termsModal = this.page.getByTestId("terms-update-popup");

  async waitToBeVisible() {
    await this.termsModal.waitFor({ state: "visible" });
  }
}
