import { act, renderHook } from "@testing-library/react";
import { contact } from "@domain/entity-contact";
import type { ContactCreationPort } from "./ports";
import { useAddContactDrawerViewModel } from "./useAddContactDrawerViewModel";

describe("useAddContactDrawerViewModel", () => {
  it("should save through the injected port, reset the draft, and close", async () => {
    const onSaveSuccess = jest.fn();
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(async ({ name }) =>
        contact({
          id: "contact-ada",
          isMe: false,
          name,
          addresses: [],
        }),
      ),
    };
    const { result } = renderHook(() =>
      useAddContactDrawerViewModel({ contactCreation, onSaveSuccess }),
    );

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(contactCreation.createContact).toHaveBeenCalledWith({ name: "Ada" });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      isOpen: false,
      draftName: "",
      isConfirmEnabled: false,
    });
  });
});
