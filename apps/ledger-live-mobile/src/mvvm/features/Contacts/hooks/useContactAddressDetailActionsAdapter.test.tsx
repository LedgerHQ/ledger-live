import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useContactAddressDetailDialog, usePopulatedContactDetail } from "@features/flow-contacts";
import { useContactAddressDetailActionsAdapter } from "./useContactAddressDetailActionsAdapter";

jest.mock("LLM/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => ({ handleOpenSendFlow: jest.fn() }),
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

describe("useContactAddressDetailActionsAdapter", () => {
  it("should reopen the same address after cancelling the rename drawer", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const Wrapper = makeWrapper([mockMeContact(), contact]);
    const { result } = renderHook(
      () => {
        const populatedContactDetail = usePopulatedContactDetail(contact.id, {
          resolveNetworkId: () => getCryptoCurrencyById("ethereum").id,
        });
        const addressDetail = useContactAddressDetailDialog(populatedContactDetail);
        const actions = useContactAddressDetailActionsAdapter(
          contact.id,
          addressDetail.selection?.row.addressId,
          addressDetail.onClose,
        );

        return { addressDetail, actions };
      },
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.addressDetail.onAddressRowPress({
        type: "open-address-detail",
        contactId: contact.id,
        addressId: address.id,
      });
    });

    expect(result.current.addressDetail.isOpen).toBe(true);

    act(() => {
      result.current.actions.renameSheet.onClose();
    });

    expect(result.current.addressDetail.isOpen).toBe(false);

    act(() => {
      result.current.addressDetail.onAddressRowPress({
        type: "open-address-detail",
        contactId: contact.id,
        addressId: address.id,
      });
    });

    expect(result.current.addressDetail.isOpen).toBe(true);
  });
});
