import { act, renderHook } from "@testing-library/react";
import { contactAddress } from "@domain/entity-contact";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import type { ContactAddressEditPort } from "@features/platform-contacts";
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

  it("should keep the draft while the signer approval is pending", async () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const updateAddress = jest.fn().mockResolvedValue(
      contactAddress({
        ...address,
        label: "Main ETH",
      }),
    );
    let approveSave!: (approved: boolean) => void;
    const requestSaveApproval = jest.fn(
      () =>
        new Promise<boolean>(resolve => {
          approveSave = resolve;
        }),
    );
    const { result, rerender } = renderHook(
      ({ isRequestedOpen }) =>
        useRenameAddressDialogViewModel({
          contactId: contact.id,
          addressId: address.id,
          currentLabel: address.label,
          currentAddress: address.address,
          currencyId: address.currencyId,
          existingLabels: [],
          editPort: createEditPort({ updateAddress }),
          isRequestedOpen,
          isEditSessionActive: true,
          onCloseRequest,
          onSaveSuccess,
          requestSaveApproval,
        }),
      { initialProps: { isRequestedOpen: true } },
    );

    act(() => {
      result.current.onDraftLabelChange("Main ETH");
    });

    let confirmed!: Promise<void>;

    act(() => {
      confirmed = result.current.onConfirm();
    });

    rerender({ isRequestedOpen: false });

    expect(updateAddress).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(true);
    expect(result.current.draftLabel).toBe("Main ETH");
    expect(result.current.addressEntry.value).toBe(address.address);

    await act(async () => {
      approveSave(true);
      await confirmed;
    });

    expect(updateAddress).toHaveBeenCalledWith({
      contactId: contact.id,
      addressId: address.id,
      label: "Main ETH",
      address: address.address,
    });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
  });

  it("should not save when the signer approval is declined", async () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const updateAddress = jest.fn();
    const requestSaveApproval = jest.fn().mockResolvedValue(false);
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
        isEditSessionActive: true,
        onCloseRequest,
        onSaveSuccess,
        requestSaveApproval,
      }),
    );

    act(() => {
      result.current.onDraftLabelChange("Main ETH");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(updateAddress).not.toHaveBeenCalled();
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(onCloseRequest).not.toHaveBeenCalled();
    expect(result.current.draftLabel).toBe("Main ETH");
    expect(result.current.addressEntry.value).toBe(address.address);
    expect(result.current.isSaving).toBe(false);
  });

  it("GIVEN a failed save WHEN confirming THEN it stays closed without notifying success", async () => {
    // GIVEN
    const onCloseRequest = jest.fn();
    const onSaveStart = jest.fn();
    const onSaveSuccess = jest.fn();
    const updateAddress = jest.fn().mockRejectedValue(new Error("device rejected"));
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
        onSaveStart,
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.onDraftLabelChange("Main ETH");
    });

    // WHEN
    await act(async () => {
      await result.current.onConfirm();
    });

    // THEN
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(onSaveStart).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });

  it("GIVEN a save handed to the device WHEN confirming THEN it closes before the outcome is known", async () => {
    // GIVEN
    const onCloseRequest = jest.fn();
    const onSaveStart = jest.fn();
    const onSaveSuccess = jest.fn();
    let resolveUpdate: () => void = () => undefined;
    const updateAddress = jest.fn().mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveUpdate = () => resolve();
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
        onSaveStart,
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.onDraftLabelChange("Main ETH");
    });

    // WHEN
    let confirmed: Promise<void> = Promise.resolve();
    await act(async () => {
      confirmed = result.current.onConfirm();
    });

    // THEN
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(onSaveStart).toHaveBeenCalledTimes(1);
    expect(onSaveSuccess).not.toHaveBeenCalled();

    await act(async () => {
      resolveUpdate();
      await confirmed;
    });

    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
  });
});
