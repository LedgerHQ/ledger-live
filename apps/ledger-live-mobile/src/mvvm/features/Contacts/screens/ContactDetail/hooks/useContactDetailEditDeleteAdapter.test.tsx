import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import { createMockContactDeviceIntentsPort } from "@features/platform-contacts/test";
import { useContactDetailEditDeleteAdapter } from "./useContactDetailEditDeleteAdapter";

const deviceIntents = createMockContactDeviceIntentsPort();

jest.mock("../../../analytics/useContactsAnalytics", () => ({
  useContactsAnalytics: () => ({
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  }),
}));

function makeWrapper(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe("useContactDetailEditDeleteAdapter", () => {
  it("should open the delete confirmation on press, without any sheet lifecycle callback", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([contact]);
    const { result } = renderHook(
      () => useContactDetailEditDeleteAdapter(contact.id, jest.fn(), deviceIntents),
      {
        wrapper: Wrapper,
      },
    );

    act(() => {
      result.current.onOpenActionsMenu();
    });
    expect(result.current.actionsMenu.isOpen).toBe(true);

    act(() => {
      result.current.actionsMenu.onDelete();
    });

    expect(result.current.actionsMenu.isOpen).toBe(false);
    expect(result.current.deleteDrawer.isOpen).toBe(true);
  });

  it("should reopen the delete confirmation after cancelling it", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([contact]);
    const { result } = renderHook(
      () => useContactDetailEditDeleteAdapter(contact.id, jest.fn(), deviceIntents),
      {
        wrapper: Wrapper,
      },
    );

    act(() => {
      result.current.onOpenActionsMenu();
    });
    act(() => {
      result.current.actionsMenu.onDelete();
    });
    expect(result.current.deleteDrawer.isOpen).toBe(true);

    act(() => {
      result.current.deleteDrawer.onCancel();
    });
    expect(result.current.deleteDrawer.isOpen).toBe(false);

    act(() => {
      result.current.onOpenActionsMenu();
    });
    act(() => {
      result.current.actionsMenu.onDelete();
    });

    expect(result.current.deleteDrawer.isOpen).toBe(true);
  });
});
