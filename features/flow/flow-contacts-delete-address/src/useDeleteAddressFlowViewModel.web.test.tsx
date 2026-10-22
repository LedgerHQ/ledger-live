import { ContactAddressIdSchema, ContactIdSchema } from "@domain/entity-contact";
import { act, renderHook } from "@testing-library/react";
import { useDeleteAddressFlowViewModel } from "./useDeleteAddressFlowViewModel";

const contactId = ContactIdSchema.parse("contact-ben");
const addressId = ContactAddressIdSchema.parse("address-ethereum");

describe("useDeleteAddressFlowViewModel", () => {
  it("opens, confirms and notifies success for a selected address", async () => {
    const onSuccess = jest.fn();
    const deletionPort = { deleteAddress: jest.fn().mockResolvedValue(undefined) };
    const { result } = renderHook(() =>
      useDeleteAddressFlowViewModel({ contactId, addressId, deletionPort, onSuccess }),
    );

    act(() => result.current.openDelete());
    expect(result.current.deleteLifecycle).toEqual({ status: "open", contactId, addressId });
    expect(result.current.deleteIntent).toEqual({
      type: "delete-address",
      contactId,
      addressId,
    });

    await act(async () => result.current.confirmDelete());
    expect(deletionPort.deleteAddress).toHaveBeenCalledWith({ contactId, addressId });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });
    expect(result.current.isDeleting).toBe(false);
  });

  it("does not open deletion when no address is selected", async () => {
    const deletionPort = { deleteAddress: jest.fn() };
    const { result } = renderHook(() =>
      useDeleteAddressFlowViewModel({ contactId, addressId: undefined, deletionPort }),
    );

    act(() => result.current.openDelete());
    expect(result.current.canDelete).toBe(false);
    expect(result.current.deleteIntent).toBeUndefined();
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });

    await act(async () => result.current.confirmDelete());
    expect(deletionPort.deleteAddress).not.toHaveBeenCalled();
  });

  it("keeps an error lifecycle when deletion fails", async () => {
    const deletionPort = {
      deleteAddress: jest.fn().mockRejectedValue(new Error("delete failed")),
    };
    const { result } = renderHook(() =>
      useDeleteAddressFlowViewModel({ contactId, addressId, deletionPort }),
    );

    act(() => result.current.openDelete());

    await act(async () => result.current.confirmDelete());

    expect(result.current.deleteLifecycle).toEqual({
      status: "error",
      contactId,
      addressId,
    });
    expect(result.current.isDeleting).toBe(false);
  });
});
