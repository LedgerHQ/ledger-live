import { ContactDialog } from "tests/page/dialog/contact.dialog";

export class ContactAddDialog extends ContactDialog {
  protected readonly dialog = this.page.getByTestId("contacts-add-contact-dialog");
  protected readonly nameInput = this.dialog.getByTestId("contacts-add-contact-name-input");
  protected readonly confirmButton = this.dialog.getByTestId("contacts-add-contact-save");
}
