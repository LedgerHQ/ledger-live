import { act, renderHook } from "@testing-library/react";
import { contact } from "@domain/entity-contact";
import { mockContact } from "@domain/entity-contact/schema.mock";
import type { ContactEditPort } from "../Detail/model/ports";
import { useRenameContactDialogViewModel } from "./useRenameContactDialogViewModel";

describe("useRenameContactDialogViewModel", () => {
  const savedContact = mockContact();

  function createEditPort(overrides: Partial<ContactEditPort> = {}): ContactEditPort {
    return {
      renameContact: jest.fn().mockResolvedValue(
        contact({
          id: savedContact.id,
          isMe: false,
          name: "Ben",
          addresses: [],
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
        useRenameContactDialogViewModel({
          contactId: savedContact.id,
          currentName: "Ada",
          editPort: createEditPort(),
          isRequestedOpen,
          onCloseRequest,
          onSaveSuccess,
        }),
      { initialProps: { isRequestedOpen: false } },
    );

    act(() => {
      result.current.onDraftNameChange("Changed");
    });
    expect(result.current.draftName).toBe("Changed");

    rerender({ isRequestedOpen: true });
    expect(result.current.draftName).toBe("Ada");
  });

  it("should save, notify success, and close when confirm succeeds", async () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const renameContact = jest.fn().mockResolvedValue(
      contact({
        id: savedContact.id,
        isMe: false,
        name: "Ben",
        addresses: [],
      }),
    );
    const { result } = renderHook(() =>
      useRenameContactDialogViewModel({
        contactId: savedContact.id,
        currentName: "Ada",
        editPort: createEditPort({ renameContact }),
        isRequestedOpen: true,
        onCloseRequest,
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.onDraftNameChange("Ben");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(renameContact).toHaveBeenCalledWith({ contactId: savedContact.id, name: "Ben" });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });

  it("should reset the draft and close when cancel is requested", () => {
    const onCloseRequest = jest.fn();
    const onSaveSuccess = jest.fn();
    const { result } = renderHook(() =>
      useRenameContactDialogViewModel({
        contactId: savedContact.id,
        currentName: "Ada",
        editPort: createEditPort(),
        isRequestedOpen: true,
        onCloseRequest,
        onSaveSuccess,
      }),
    );

    act(() => {
      result.current.onDraftNameChange("Ben");
      result.current.onClose();
    });

    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(result.current.draftName).toBe("Ada");
  });
});
