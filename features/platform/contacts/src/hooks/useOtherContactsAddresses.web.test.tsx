import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice, type Contact } from "@domain/entity-contact";
import {
  mockContactAddress,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { ContactsI18nTestProvider } from "../testing/ContactsI18nTestProvider";
import { useOtherContactsAddresses } from "./useOtherContactsAddresses";

const me = mockMeContact({ addresses: [mockContactAddress({ id: "me-eth", address: "0xme" })] });
const ada = mockContactWithAddress({
  id: "contact-ada",
  name: "Ada",
  addresses: [mockContactAddress({ id: "ada-eth", address: "0xada" })],
});

function renderOtherContactsAddresses(contacts: Contact[], excludeContactId?: Contact["id"]) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <ContactsI18nTestProvider>{children}</ContactsI18nTestProvider>
    </Provider>
  );

  return renderHook(() => useOtherContactsAddresses(excludeContactId), { wrapper }).result.current;
}

describe("useOtherContactsAddresses", () => {
  it("lists every saved address with its owner's display name", () => {
    expect(renderOtherContactsAddresses([me, ada])).toEqual([
      { contactId: me.id, contactName: "My addresses (Me)", address: "0xme" },
      { contactId: ada.id, contactName: "Ada", address: "0xada" },
    ]);
  });

  it("leaves out the contact being edited", () => {
    expect(renderOtherContactsAddresses([me, ada], ada.id)).toEqual([
      { contactId: me.id, contactName: "My addresses (Me)", address: "0xme" },
    ]);
  });
});
