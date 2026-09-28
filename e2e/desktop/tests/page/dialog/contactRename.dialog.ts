import { ContactDialog } from "tests/page/dialog/contact.dialog";

export class ContactRenameDialog extends ContactDialog {
  protected readonly dialog = this.page.getByTestId("contacts-rename-contact-dialog");
  protected readonly nameInput = this.dialog.getByTestId("contacts-rename-contact-name-input");
  protected readonly confirmButton = this.dialog.getByTestId("contacts-rename-contact-confirm");
}
