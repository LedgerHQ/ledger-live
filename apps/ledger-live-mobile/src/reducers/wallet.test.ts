import { setContacts } from "@domain/entity-contact";
import { mockContact, mockEmptyContacts } from "@domain/entity-contact/schema.mock";
import {
  exportWalletState,
  importWalletState,
  INITIAL_STATE,
  walletStateExportShouldDiffer,
} from "./wallet";

describe("wallet persistence", () => {
  const contacts = {
    contacts: [...mockEmptyContacts(), mockContact({ id: "contact-ada", name: "Ada" })],
  };

  it("exports Contacts with the wallet state", () => {
    expect(exportWalletState({ wallet: INITIAL_STATE, contacts }).contacts).toEqual(
      contacts.contacts,
    );
  });

  it("persists when Contacts change", () => {
    expect(
      walletStateExportShouldDiffer(
        { wallet: INITIAL_STATE, contacts: { contacts: mockEmptyContacts() } },
        { wallet: INITIAL_STATE, contacts },
      ),
    ).toBe(true);
  });

  it("restores persisted Contacts", () => {
    const dispatch = jest.fn();

    importWalletState({ contacts: contacts.contacts })(dispatch);

    expect(dispatch).toHaveBeenCalledWith(setContacts(contacts.contacts));
  });
});
