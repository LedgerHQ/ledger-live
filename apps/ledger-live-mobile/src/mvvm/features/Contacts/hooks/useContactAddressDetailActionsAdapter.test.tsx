import React, { type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { contactsSlice } from "@domain/entity-contact";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  useContactAddressDetailDialog,
  usePopulatedContactDetail,
} from "@features/flow-contacts";
import { createMockContactDeviceIntentsPort } from "@features/platform-contacts";
import { useContactAddressDetailActionsAdapter } from "./useContactAddressDetailActionsAdapter";

const trackEvent = jest.fn();
const trackPage = jest.fn();
const deviceIntents = createMockContactDeviceIntentsPort();

jest.mock("LLM/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => ({ handleOpenSendFlow: jest.fn() }),
}));

jest.mock("../analytics", () => ({
  contactsCurrencyAnalyticsDependencies: {},
  resolveContactsCurrencyAnalytics: jest.fn().mockResolvedValue({
    network: "Ethereum",
    asset: "ETH",
  }),
  useContactsAnalytics: () => ({
    trackEvent,
    trackPage,
    getGlobalProperties: jest.fn(),
  }),
}));

jest.mock("./useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: () => ({
    validateAddress: async ({ address }: { address: string }) => ({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    }),
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

describe("useContactAddressDetailActionsAdapter", () => {
  beforeEach(() => {
    trackEvent.mockClear();
    trackPage.mockClear();
  });

  it("should return inactive actions when no address is selected", () => {
    const Wrapper = makeWrapper([mockMeContact()]);
    const { result } = renderHook(
      () => useContactAddressDetailActionsAdapter(undefined, undefined, jest.fn(), deviceIntents),
      { wrapper: Wrapper },
    );

    expect(result.current.addressDetailDialog.canEdit).toBe(false);
    expect(result.current.addressDetailDialog.canDelete).toBe(false);
    expect(result.current.deleteSheet.isOpen).toBe(false);
  });

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
          deviceIntents,
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
      result.current.actions.addressDetailDialog.onEdit?.();
    });

    expect(result.current.actions.renameSheet.isOpen).toBe(true);

    act(() => {
      result.current.actions.renameSheet.onClose();
    });

    expect(result.current.actions.renameSheet.isOpen).toBe(false);
    expect(result.current.addressDetail.isOpen).toBe(true);
  });

  it("should track edit-address page and apply-changes analytics", async () => {
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
          deviceIntents,
          "ETH",
          "Ethereum",
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

    act(() => {
      result.current.actions.addressDetailDialog.onEdit?.();
    });

    expect(result.current.actions.signerSheet.isOpen).toBe(false);

    await waitFor(() => {
      expect(result.current.actions.renameSheet.isOpen).toBe(true);
    });

    expect(trackPage).toHaveBeenCalledWith(CONTACTS_PAGE_EVENTS.EDIT_ADDRESS, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      network: "Ethereum",
      asset: "ETH",
    });

    act(() => {
      result.current.actions.renameSheet.onDraftLabelChange("Main ETH");
    });

    let confirmed!: Promise<void>;

    act(() => {
      confirmed = result.current.actions.renameSheet.onConfirm();
    });

    expect(trackEvent).toHaveBeenCalledWith(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      button: CONTACTS_TRACKING_BUTTON.applyChanges,
      page: CONTACTS_PAGE_PROPERTY.EDIT_ADDRESS,
      asset: "ETH",
      network: "Ethereum",
      flow: CONTACTS_FLOW.CONTACTS,
    });

    await waitFor(() => {
      expect(result.current.actions.signerSheet.isOpen).toBe(true);
    });

    await act(async () => {
      await result.current.actions.signerSheet.onConfirm();
      await confirmed;
    });

    expect(trackPage).toHaveBeenCalledTimes(1);
  });
});
