import { mockMeContact } from "@domain/entity-contact/schema.mock";
import { act, renderHook } from "@tests/test-renderer";
import { useContactsAddContactDrawerViewModel } from "./useContactsAddContactDrawerViewModel";

describe("useContactsAddContactDrawerViewModel", () => {
  it("should add a valid contact, reset the draft, and close the drawer", async () => {
    const onSaveSuccess = jest.fn();
    const { result, store } = renderHook(
      () => useContactsAddContactDrawerViewModel(onSaveSuccess),
      {
        overrideInitialState: state => ({
          ...state,
          contacts: { contacts: [mockMeContact()] },
        }),
      },
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isConfirmEnabled).toBe(false);

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada1");
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isConfirmEnabled).toBe(false);

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(store.getState().contacts.contacts).toEqual([mockMeContact()]);

    act(() => {
      result.current.onDraftNameChange("Ada");
    });

    expect(result.current.isConfirmEnabled).toBe(true);

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(store.getState().contacts.contacts).toEqual([
      mockMeContact(),
      expect.objectContaining({
        id: expect.stringMatching(/^contact-/),
        isMe: false,
        name: "Ada",
        addresses: [],
      }),
    ]);
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.draftName).toBe("");
    expect(result.current.isOpen).toBe(false);
  });
});
