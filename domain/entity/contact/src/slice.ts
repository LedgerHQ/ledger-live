import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { contact } from "./define";
import { normalizeContacts } from "./internals";
import type { Contact, ContactAddress, ContactId, ContactName, ContactsState } from "./types";

const defaultMeContact = contact({
  id: "contact-me",
  isMe: true,
  name: "Me",
  addresses: [],
});

export const contactsInitialState = {
  contacts: [defaultMeContact],
} satisfies ContactsState;

export const contactsSlice = createSlice({
  name: "contacts",
  initialState: contactsInitialState,
  reducers: {
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = normalizeContacts(state.contacts, action.payload, defaultMeContact);
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      if (action.payload.isMe || state.contacts.some(contact => contact.id === action.payload.id)) {
        return;
      }

      state.contacts.push(action.payload);
    },
    renameContact: (
      state,
      action: PayloadAction<Readonly<{ contactId: ContactId; name: ContactName }>>,
    ) => {
      const selectedContact = state.contacts.find(
        contact => contact.id === action.payload.contactId,
      );

      if (selectedContact) {
        selectedContact.name = action.payload.name;
      }
    },
    deleteContact: (state, action: PayloadAction<ContactId>) => {
      const contactIndex = state.contacts.findIndex(contact => contact.id === action.payload);
      const selectedContact = state.contacts[contactIndex];

      if (contactIndex >= 0 && !selectedContact?.isMe) {
        state.contacts.splice(contactIndex, 1);
      }
    },
    addAddress: (
      state,
      action: PayloadAction<Readonly<{ contactId: ContactId; address: ContactAddress }>>,
    ) => {
      const selectedContact = state.contacts.find(
        contact => contact.id === action.payload.contactId,
      );

      if (
        selectedContact &&
        !selectedContact.addresses.some(address => address.id === action.payload.address.id)
      ) {
        selectedContact.addresses.push(action.payload.address);
      }
    },
    updateAddress: (
      state,
      action: PayloadAction<Readonly<{ contactId: ContactId; address: ContactAddress }>>,
    ) => {
      const selectedContact = state.contacts.find(
        contact => contact.id === action.payload.contactId,
      );
      const addressIndex = selectedContact?.addresses.findIndex(
        address => address.id === action.payload.address.id,
      );

      if (selectedContact && addressIndex !== undefined && addressIndex >= 0) {
        selectedContact.addresses[addressIndex] = action.payload.address;
      }
    },
    deleteAddress: (
      state,
      action: PayloadAction<Readonly<{ contactId: ContactId; addressId: ContactAddress["id"] }>>,
    ) => {
      const selectedContact = state.contacts.find(
        contact => contact.id === action.payload.contactId,
      );

      if (selectedContact) {
        selectedContact.addresses = selectedContact.addresses.filter(
          address => address.id !== action.payload.addressId,
        );
      }
    },
  },
});

export const {
  setContacts,
  addContact,
  renameContact,
  deleteContact,
  addAddress,
  updateAddress,
  deleteAddress,
} = contactsSlice.actions;
