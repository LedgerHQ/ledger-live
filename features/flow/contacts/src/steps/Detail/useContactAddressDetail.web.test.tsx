import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ContactAddressIdSchema, ContactIdSchema, contactsSlice } from "@domain/entity-contact";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressDetailPort } from "./model/ports";
import { useContactAddressDetail } from "./useContactAddressDetail";

const ethereum = getCryptoCurrencyById("ethereum");

const addressDetailPort: ContactAddressDetailPort = {
  resolveNetwork: () => ({
    id: ethereum.id,
    name: ethereum.name,
  }),
  resolveAsset: () => ({
    currencyId: ethereum.id,
    name: ethereum.name,
    ticker: ethereum.ticker,
  }),
  resolveQrPayload: contactAddress => contactAddress.address,
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

describe("useContactAddressDetail", () => {
  it("should expose the selected address payload", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0];
    const Wrapper = makeWrapper([mockMeContact(), contact]);

    expect(address).toBeDefined();

    const { result } = renderHook(
      () => useContactAddressDetail(contact.id, address!.id, addressDetailPort),
      { wrapper: Wrapper },
    );

    expect(result.current).toMatchObject({
      displayMode: "found",
      address: address!.address,
      label: address!.label,
      qrPayload: address!.address,
    });
  });

  it("should return not-found when the address does not exist", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () =>
        useContactAddressDetail(
          contact.id,
          ContactAddressIdSchema.parse("address-missing"),
          addressDetailPort,
        ),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({ displayMode: "not-found" });
  });

  it("should return not-found when the contact does not exist", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0];
    const Wrapper = makeWrapper([mockMeContact()]);
    const { result } = renderHook(
      () =>
        useContactAddressDetail(
          ContactIdSchema.parse("contact-missing"),
          address!.id,
          addressDetailPort,
        ),
      { wrapper: Wrapper },
    );

    expect(result.current).toEqual({ displayMode: "not-found" });
  });
});
