import { configureStore } from "@reduxjs/toolkit";
import {
  addAddress,
  addContact,
  contactsInitialState,
  contactsSlice,
  deleteAddress,
  deleteContact,
  renameContact,
  setContacts,
  updateAddress,
} from "./slice";
import { mockContact, mockContactAddress, mockMeContact } from "./schema.mock";
import { ContactNameSchema } from "./schema";

function makeStore() {
  return configureStore({
    reducer: { contacts: contactsSlice.reducer },
  });
}

describe("contactsSlice", () => {
  it("starts with the default Me contact", () => {
    expect(contactsInitialState.contacts).toEqual([mockMeContact()]);
  });

  it("replaces contacts with the incoming Me contact", () => {
    const store = makeStore();
    const ben = mockContact();
    const me = mockMeContact({ name: "Raphael" });

    store.dispatch(setContacts([me, ben]));

    expect(store.getState().contacts.contacts).toEqual([me, ben]);
  });

  it("preserves Me when replacing contacts without one", () => {
    const store = makeStore();
    const me = mockMeContact();
    const ben = mockContact();
    store.dispatch(renameContact({ contactId: me.id, name: ContactNameSchema.parse("Raphael") }));

    store.dispatch(setContacts([ben]));

    expect(store.getState().contacts.contacts).toEqual([mockMeContact({ name: "Raphael" }), ben]);
  });

  it("keeps only the first Me contact when replacing contacts", () => {
    const store = makeStore();
    const firstMe = mockMeContact({ name: "Raphael" });
    const secondMe = mockMeContact({ id: "contact-other-me", name: "Other" });

    store.dispatch(setContacts([firstMe, secondMe, mockContact()]));

    expect(store.getState().contacts.contacts).toEqual([firstMe, mockContact()]);
  });

  it("adds a saved contact", () => {
    const store = makeStore();
    const ben = mockContact();

    store.dispatch(addContact(ben));

    expect(store.getState().contacts.contacts).toEqual([mockMeContact(), ben]);
  });

  it("does not add a second Me contact", () => {
    const store = makeStore();

    store.dispatch(addContact(mockMeContact({ id: "contact-other-me", name: "Other" })));

    expect(store.getState().contacts.contacts).toEqual([mockMeContact()]);
  });

  it("does not duplicate a contact with the same id", () => {
    const store = makeStore();
    const ben = mockContact();

    store.dispatch(addContact(ben));
    store.dispatch(addContact(ben));

    expect(store.getState().contacts.contacts).toEqual([mockMeContact(), ben]);
  });

  it("allows Me to be renamed but does not delete Me", () => {
    const store = makeStore();
    const me = mockMeContact();

    store.dispatch(renameContact({ contactId: me.id, name: ContactNameSchema.parse("Raphael") }));
    store.dispatch(deleteContact(me.id));

    expect(store.getState().contacts.contacts).toEqual([mockMeContact({ name: "Raphael" })]);
  });

  it("deletes a saved contact", () => {
    const store = makeStore();
    const ben = mockContact();

    store.dispatch(addContact(ben));
    store.dispatch(deleteContact(ben.id));

    expect(store.getState().contacts.contacts).toEqual([mockMeContact()]);
  });

  it("adds an address to the intended contact", () => {
    const store = makeStore();
    const ben = mockContact();
    const address = mockContactAddress({
      id: "address-usdt",
      currencyId: "ethereum/erc20/usd-tether",
      label: "USDT",
    });

    store.dispatch(addContact(ben));
    store.dispatch(addAddress({ contactId: ben.id, address }));

    expect(store.getState().contacts.contacts[1]?.addresses).toEqual([address]);
  });

  it("updates an address on the intended contact", () => {
    const store = makeStore();
    const ben = mockContact();
    const address = mockContactAddress();

    store.dispatch(addContact(ben));
    store.dispatch(addAddress({ contactId: ben.id, address }));
    store.dispatch(
      updateAddress({ contactId: ben.id, address: { ...address, label: "Treasury" } }),
    );

    expect(store.getState().contacts.contacts[1]?.addresses).toEqual([
      { ...address, label: "Treasury" },
    ]);
  });

  it("deletes an address from the intended contact", () => {
    const store = makeStore();
    const ben = mockContact();
    const address = mockContactAddress();

    store.dispatch(addContact(ben));
    store.dispatch(addAddress({ contactId: ben.id, address }));

    store.dispatch(deleteAddress({ contactId: ben.id, addressId: address.id }));

    expect(store.getState().contacts.contacts[1]?.addresses).toEqual([]);
  });

  it("does not duplicate an address with the same id", () => {
    const store = makeStore();
    const ben = mockContact();
    const address = mockContactAddress();

    store.dispatch(addContact(ben));
    store.dispatch(addAddress({ contactId: ben.id, address }));
    store.dispatch(addAddress({ contactId: ben.id, address }));

    expect(store.getState().contacts.contacts[1]?.addresses).toEqual([address]);
  });
});
