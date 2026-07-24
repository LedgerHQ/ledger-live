import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ContactIdSchema, contactsSlice } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { useEmptyContactDetail } from "./useEmptyContactDetail";

function makeWrapper(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(Provider, { store, children });
  };
}

describe("useEmptyContactDetail", () => {
  it("should return the existing contact when it has no address", () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(() => useEmptyContactDetail(contact.id), {
      wrapper: Wrapper,
    });

    expect(result.current).toBe(contact);
  });

  it("should return undefined when the contact already has an address", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(() => useEmptyContactDetail(contact.id), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeUndefined();
  });

  it("should return undefined when the contact does not exist", () => {
    const Wrapper = makeWrapper([mockMeContact()]);
    const { result } = renderHook(
      () => useEmptyContactDetail(ContactIdSchema.parse("contact-missing")),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });
});
