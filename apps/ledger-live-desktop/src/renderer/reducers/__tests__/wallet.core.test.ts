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
    expect(exportWalletState({ wallet: initialState, contacts }).contacts).toEqual(
      contacts.contacts,
    );
  });

  it("persists when Contacts change", () => {
    expect(
      walletStateExportShouldDiffer(
        { wallet: initialState, contacts: { contacts: mockEmptyContacts() } },
        { wallet: initialState, contacts },
      ),
    ).toBe(true);
  });

  it("restores persisted Contacts", () => {
    const dispatch = jest.fn();

    importWalletState({ contacts: contacts.contacts })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(setContacts(contacts.contacts));
  });
});
