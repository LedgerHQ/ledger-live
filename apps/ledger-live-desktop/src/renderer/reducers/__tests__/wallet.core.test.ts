import { setContacts } from "@domain/entity-contact";
import { mockContact, mockEmptyContacts } from "@domain/entity-contact/schema.mock";
import {
  exportWalletState,
  importWalletState,
  initialState,
  walletStateExportShouldDiffer,
} from "../wallet.core";

describe("wallet persistence", () => {
  const contacts = {
    contacts: [...mockEmptyContacts(), mockContact({ id: "contact-ada", name: "Ada" })],
  };

  it("exports Contacts with the wallet state", () => {
    expect(exportWalletState(initialState, contacts).contacts).toEqual(contacts.contacts);
  });

  it("persists when Contacts change", () => {
    expect(
      walletStateExportShouldDiffer(
        initialState,
        initialState,
        { contacts: mockEmptyContacts() },
        contacts,
      ),
    ).toBe(true);
  });

  it("restores persisted Contacts", () => {
    const dispatch = jest.fn();

    importWalletState({ contacts: contacts.contacts })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(setContacts(contacts.contacts));
  });
});
