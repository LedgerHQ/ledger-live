import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";

export function makeContactsWrapper(
  contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"],
) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(Provider, { store, children });
  };
}
