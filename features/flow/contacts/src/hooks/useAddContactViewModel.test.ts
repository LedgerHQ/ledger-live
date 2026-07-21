import { renderHook, act } from "@testing-library/react";
import { contact } from "@domain/entity-contact";
import type { ContactCreationPort } from "../add/ports";
import { useAddContactViewModel } from "./useAddContactViewModel";

describe("useAddContactViewModel", () => {
  it("updates derived state when the draft name changes", () => {
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(),
    };

    const { result } = renderHook(() => useAddContactViewModel(contactCreation));

    expect(result.current.isSaveEnabled).toBe(false);

    act(() => {
      result.current.setDraftName("Ben");
    });

    expect(result.current).toMatchObject({
      draftName: "Ben",
      avatarInitial: "B",
      isSaveEnabled: true,
    });
  });

  it("delegates save to the injected creation port", async () => {
    const createContact = jest.fn(async ({ name }) =>
      contact({
        id: "contact-olivia",
        isMe: false,
        name,
        addresses: [],
      }),
    );
    const contactCreation: ContactCreationPort = { createContact };
    const { result } = renderHook(() => useAddContactViewModel(contactCreation));

    act(() => {
      result.current.setDraftName("Olivia");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(createContact).toHaveBeenCalledWith({ name: "Olivia" });
  });

  it("rejects save when the draft name is invalid", async () => {
    const createContact = jest.fn();
    const contactCreation: ContactCreationPort = { createContact };
    const { result } = renderHook(() => useAddContactViewModel(contactCreation));

    act(() => {
      result.current.setDraftName("Olive2");
    });

    await expect(
      act(async () => {
        await result.current.save();
      }),
    ).rejects.toThrow();
    expect(createContact).not.toHaveBeenCalled();
  });
});
