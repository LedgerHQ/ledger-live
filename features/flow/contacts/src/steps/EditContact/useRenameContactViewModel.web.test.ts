import { act, renderHook } from "@testing-library/react";
import { contact } from "@domain/entity-contact";
import { mockContact } from "@domain/entity-contact/schema.mock";
import type { ContactEditPort } from "../Detail/model/ports";
import { useRenameContactViewModel } from "./useRenameContactViewModel";

describe("useRenameContactViewModel", () => {
  it("should disable confirm when the draft name matches the current name", () => {
    const savedContact = mockContact();
    const editPort: ContactEditPort = {
      renameContact: jest.fn(),
    };
    const { result } = renderHook(() =>
      useRenameContactViewModel(savedContact.id, "Ada", "Ada", editPort),
    );

    expect(result.current.isConfirmEnabled).toBe(false);
    expect(result.current.invalidNameError).toBeNull();
  });

  it("should enable confirm and save through the injected edit port", async () => {
    const savedContact = mockContact();
    const renamedContact = contact({
      id: savedContact.id,
      isMe: false,
      name: "Ben",
      addresses: [],
    });
    const renameContact = jest.fn().mockResolvedValue(renamedContact);
    const { result } = renderHook(() =>
      useRenameContactViewModel(savedContact.id, "Ada", "Ben", { renameContact }),
    );

    expect(result.current.isConfirmEnabled).toBe(true);

    let savedContactResult: Awaited<ReturnType<typeof result.current.save>> | undefined;
    await act(async () => {
      savedContactResult = await result.current.save();
    });

    expect(renameContact).toHaveBeenCalledWith({ contactId: savedContact.id, name: "Ben" });
    expect(savedContactResult).toEqual(renamedContact);
  });
});
