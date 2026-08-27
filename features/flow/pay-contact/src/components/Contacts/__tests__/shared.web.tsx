import React, { type FC, type ReactElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice, type Contact } from "@domain/entity-contact";
import { StyleProvider } from "@features/platform-style";

export function makeContactsWrapper(contacts: Contact[]): FC<{ children: ReactNode }> {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return ({ children }) => <Provider store={store}>{children}</Provider>;
}

export function renderWithStyle(ui: ReactElement) {
  return render(<StyleProvider colorScheme="dark">{ui}</StyleProvider>);
}

export function renderWithContacts(contacts: Contact[], ui: ReactElement) {
  const Wrapper = makeContactsWrapper(contacts);

  return render(
    <Wrapper>
      <StyleProvider colorScheme="dark">{ui}</StyleProvider>
    </Wrapper>,
  );
}
