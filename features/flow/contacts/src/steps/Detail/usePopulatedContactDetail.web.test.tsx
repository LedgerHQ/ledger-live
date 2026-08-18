import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ContactIdSchema, contactsSlice } from "@domain/entity-contact";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { usePopulatedContactDetail } from "./usePopulatedContactDetail";

function makeWrapper(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  const store = configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });

  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(Provider, { store, children });
  };
}

describe("usePopulatedContactDetail", () => {
  it("should return populated detail state when the contact has addresses", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(() => usePopulatedContactDetail(contact.id), {
      wrapper: Wrapper,
    });

    expect(result.current).toMatchObject({
      displayMode: "populated",
      contact,
      addressCount: 1,
    });
  });

  it("should return undefined when the contact has no addresses", () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(() => usePopulatedContactDetail(contact.id), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeUndefined();
  });

  it("should return undefined when the contact does not exist", () => {
    const Wrapper = makeWrapper([mockMeContact()]);
    const { result } = renderHook(
      () => usePopulatedContactDetail(ContactIdSchema.parse("contact-missing")),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it("should group token addresses under their parent network", () => {
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-polygon",
          currencyId: "polygon",
          label: "Polygon",
        }),
        mockContactAddress({
          id: "address-usdc",
          currencyId: "ethereum/erc20/usd_coin",
          label: "USDC",
        }),
        mockContactAddress(),
      ],
    });
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(() => usePopulatedContactDetail(contact.id), {
      wrapper: Wrapper,
    });

    expect(result.current?.addressGroups).toMatchObject([
      {
        networkId: "ethereum",
        rows: [{ addressId: "address-ethereum" }, { addressId: "address-usdc" }],
      },
      {
        networkId: "polygon",
        rows: [{ addressId: "address-polygon" }],
      },
    ]);
  });
});
