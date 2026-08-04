import { configureStore } from "@reduxjs/toolkit";
import { contactsSlice, setContacts } from "./slice";
import {
  mockContact,
  mockContactWithAddress,
  mockMeContact,
} from "./schema.mock";
import { ContactAddressIdSchema, ContactIdSchema } from "./schema";
import {
  selectContactAddressById,
  selectContactById,
  selectContacts,
  selectMeContact,
} from "./selectors";

function makeStore() {
  return configureStore({
    reducer: { contacts: contactsSlice.reducer },
  });
}

describe("Contacts selectors", () => {
  it("selects all contacts", () => {
    const store = makeStore();
    const ben = mockContact();
    store.dispatch(setContacts([mockMeContact(), ben]));

    expect(selectContacts(store.getState())).toEqual([mockMeContact(), ben]);
  });

  it("selects Me", () => {
    const store = makeStore();
    const ben = mockContact();
    store.dispatch(setContacts([mockMeContact(), ben]));

    expect(selectMeContact(store.getState())).toEqual(mockMeContact());
  });

  it("selects a contact by id", () => {
    const store = makeStore();
    const ben = mockContact();
    store.dispatch(setContacts([mockMeContact(), ben]));

    expect(selectContactById(store.getState(), ben.id)).toEqual(ben);
    expect(
      selectContactById(store.getState(), ContactIdSchema.parse("contact-missing")),
    ).toBeUndefined();
  });

  it("selects a contact address by contact and address id", () => {
    const store = makeStore();
    const contact = mockContactWithAddress();
    store.dispatch(setContacts([mockMeContact(), contact]));
    const address = contact.addresses[0];

    expect(address).toBeDefined();
    expect(
      selectContactAddressById(store.getState(), contact.id, address!.id),
    ).toEqual(address);
    expect(
      selectContactAddressById(
        store.getState(),
        contact.id,
        ContactAddressIdSchema.parse("address-missing"),
      ),
    ).toBeUndefined();
    expect(
      selectContactAddressById(
        store.getState(),
        ContactIdSchema.parse("contact-missing"),
        address!.id,
      ),
    ).toBeUndefined();
  });
});
