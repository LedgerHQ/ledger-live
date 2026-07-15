import { configureStore } from "@reduxjs/toolkit";
import { contactsSlice, setContacts } from "./slice";
import { mockContact, mockMeContact } from "./schema.mock";
import { ContactIdSchema } from "./schema";
import { selectContactById, selectContacts, selectMeContact } from "./selectors";

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
});
