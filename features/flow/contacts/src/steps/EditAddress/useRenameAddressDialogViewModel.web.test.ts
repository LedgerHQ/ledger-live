import { act, renderHook } from "@testing-library/react";
import { contactAddress } from "@domain/entity-contact";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import type { ContactAddressEditPort } from "../Detail/model/ports";
import { useRenameAddressDialogViewModel } from "./useRenameAddressDialogViewModel";

describe("useRenameAddressDialogViewModel", () => {
  const contact = mockContactWithAddress();
  const address = contact.addresses[0]!;

  function createEditPort(overrides: Partial<ContactAddressEditPort> = {}): ContactAddressEditPort {
    return {
      updateAddress: jest.fn().mockResolvedValue(
        contactAddress({
          ...address,
          label: "Main ETH",
        }),
      ),
      ...overrides,
    };
  }

  it("should reset the draft when the dialog opens", () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const { result, rerender } = renderHook(
      ({ isRequestedOpen }) =>
        useRenameAddressDialogViewModel({
          contactId: contact.id,
          addressId: address.id,
          currentLabel: address.label,
          currentAddress: address.address,
          currencyId: address.currencyId,
          existingLabels: [],
          editPort: createEditPort(),
          isRequestedOpen,
          onCloseRequest,
          onSaveSuccess,
        }),
      { initialProps: { isRequestedOpen: false } },
    );

    act(() => {
      result.current.onDraftLabelChange("Changed");
    });
    expect(result.current.draftLabel).toBe("Changed");

    rerender({ isRequestedOpen: true });
    expect(result.current.draftLabel).toBe(address.label);
    expect(result.current.addressEntry.value).toBe(address.address);
  });

  it("should save, notify success, and close when confirm succeeds", async () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const updateAddress = jest.fn().mockResolvedValue(
      contactAddress({
        ...address,
        label: "Main ETH",
      }),
    );
    const { result } = renderHook(() =>
      useRenameAddressDialogViewModel({
        contactId: contact.id,
        addressId: address.id,
        currentLabel: address.label,
        currentAddress: address.address,
        currencyId: address.currencyId,
        existingLabels: [],
        editPort: createEditPort({ updateAddress }),
        isRequestedOpen: true,
        onCloseRequest,
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.onDraftLabelChange("Main ETH");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(updateAddress).toHaveBeenCalledWith({
      contactId: contact.id,
      addressId: address.id,
      label: "Main ETH",
      address: address.address,
    });
    expect(onSaveSuccess).toHaveBeenCalledWith({
      currencyId: address.currencyId,
      inputMethod: null,
      labelChanged: true,
      addressChanged: false,
    });
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });

  it("should still notify save success when currencyId is missing", async () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const { result } = renderHook(() =>
      useRenameAddressDialogViewModel({
        contactId: contact.id,
        addressId: address.id,
        currentLabel: address.label,
        currentAddress: address.address,
        currencyId: undefined,
        existingLabels: [],
        editPort: createEditPort(),
        isRequestedOpen: true,
        onCloseRequest,
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.onDraftLabelChange("Main ETH");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(onSaveSuccess).toHaveBeenCalledWith({
      currencyId: undefined,
      inputMethod: null,
      labelChanged: true,
      addressChanged: false,
    });
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
  });
});
