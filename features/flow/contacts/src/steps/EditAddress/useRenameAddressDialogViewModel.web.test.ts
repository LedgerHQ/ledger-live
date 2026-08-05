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
      renameAddressLabel: jest.fn().mockResolvedValue(
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
  });

  it("should save, notify success, and close when confirm succeeds", async () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const renameAddressLabel = jest.fn().mockResolvedValue(
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
        existingLabels: [],
        editPort: createEditPort({ renameAddressLabel }),
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

    expect(renameAddressLabel).toHaveBeenCalledWith({
      contactId: contact.id,
      addressId: address.id,
      label: "Main ETH",
    });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });
});
