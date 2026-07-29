import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { ContactAddressIdSchema, contactsSlice } from "@domain/entity-contact";
import {
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./model/ports";
import { createContactDetailAddressRowIntent } from "./model/viewModel";
import { useContactAddressDetailDialog } from "./useContactAddressDetailDialog";
import { usePopulatedContactDetail } from "./usePopulatedContactDetail";

const currencyPort: ContactAddressCurrencyPort = {
  resolveNetworkId: currencyId => {
    if (currencyId === getCryptoCurrencyById("ethereum").id) {
      return getCryptoCurrencyById("ethereum").id;
    }

    if (currencyId === getCryptoCurrencyById("polygon").id) {
      return getCryptoCurrencyById("polygon").id;
    }

    return undefined;
  },
};

function makeWrapper(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(Provider, { store, children });
  };
}

describe("useContactAddressDetailDialog", () => {
  it("opens the dialog when an address row is pressed", () => {
    const contact = mockContactWithMultipleAddresses();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result: populatedResult } = renderHook(
      () => usePopulatedContactDetail(contact.id, currencyPort),
      { wrapper: Wrapper },
    );
    const populatedContactDetail = populatedResult.current;

    expect(populatedContactDetail).toBeDefined();

    const { result } = renderHook(() =>
      useContactAddressDetailDialog(populatedContactDetail),
    );

    act(() => {
      result.current.onAddressRowPress(
        createContactDetailAddressRowIntent(
          contact.id,
          ContactAddressIdSchema.parse("address-ethereum"),
        ),
      );
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selection?.row.addressId).toBe("address-ethereum");
    expect(result.current.selection?.network.networkId).toBe("ethereum");
  });

  it("clears the dialog when closed", () => {
    const contact = mockContactWithMultipleAddresses();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result: populatedResult } = renderHook(
      () => usePopulatedContactDetail(contact.id, currencyPort),
      { wrapper: Wrapper },
    );
    const populatedContactDetail = populatedResult.current;
    const { result } = renderHook(() =>
      useContactAddressDetailDialog(populatedContactDetail),
    );

    act(() => {
      result.current.onAddressRowPress(
        createContactDetailAddressRowIntent(
          contact.id,
          ContactAddressIdSchema.parse("address-ethereum"),
        ),
      );
    });
    act(() => {
      result.current.onClose();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selection).toBeUndefined();
  });
});
