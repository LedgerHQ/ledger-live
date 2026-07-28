import { createElement, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { ContactIdSchema, contactsSlice } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./model/ports";
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

describe("usePopulatedContactDetail", () => {
  it("should return populated detail state when the contact has addresses", () => {
    const contact = mockContactWithAddress();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => usePopulatedContactDetail(contact.id, currencyPort),
      { wrapper: Wrapper },
    );

    expect(result.current).toMatchObject({
      displayMode: "populated",
      contact,
      addressCount: 1,
    });
  });

  it("should return undefined when the contact has no addresses", () => {
    const contact = mockContact();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => usePopulatedContactDetail(contact.id, currencyPort),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it("should return undefined when the contact does not exist", () => {
    const Wrapper = makeWrapper([mockMeContact()]);
    const { result } = renderHook(
      () => usePopulatedContactDetail(ContactIdSchema.parse("contact-missing"), currencyPort),
      { wrapper: Wrapper },
    );

    expect(result.current).toBeUndefined();
  });

  it("should expose address groups ordered by network", () => {
    const contact = mockContactWithMultipleAddresses();
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => usePopulatedContactDetail(contact.id, currencyPort),
      { wrapper: Wrapper },
    );

    expect(
      result.current?.addressGroups.flatMap(group => group.rows.map(row => row.addressId)),
    ).toEqual(["address-ethereum", "address-polygon"]);
  });
});
