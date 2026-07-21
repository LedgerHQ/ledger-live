import type { FC, ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContactsSearchViewModel } from "./useContactsSearchViewModel";

function makeWrapper() {
  const me = mockMeContact();
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: {
      contacts: {
        contacts: [me, mockContact({ id: "contact-ada", name: "Ada" })],
      },
    },
  });
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { Wrapper };
}

describe("useContactsSearchViewModel", () => {
  it("restores the full contacts list when the query is cleared", () => {
    const { Wrapper } = makeWrapper();
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useContactsSearchViewModel(query),
      { initialProps: { query: "Ada" }, wrapper: Wrapper },
    );

    expect(result.current).toMatchObject({
      status: "results",
      displayMode: "populated",
      savedContacts: [{ name: "Ada" }],
    });
    expect("me" in result.current).toBe(false);

    rerender({ query: "" });

    expect(result.current).toMatchObject({
      displayMode: "populated",
      savedContacts: [{ name: "Ada" }],
    });
    expect("status" in result.current).toBe(false);
  });

  it("returns the local no-results state when no saved contact matches", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useContactsSearchViewModel("Unknown"), {
      wrapper: Wrapper,
    });

    expect(result.current).toMatchObject({
      status: "no-results",
      displayMode: "empty",
    });
    expect("me" in result.current).toBe(false);
  });
});
