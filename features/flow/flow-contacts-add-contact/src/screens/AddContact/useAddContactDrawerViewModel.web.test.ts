import { act, renderHook } from "@testing-library/react";
import { contact, INVALID_CONTACT_NAME_ERROR_NAME } from "@domain/entity-contact";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContacts } from "@features/platform-contacts";
import type { ContactCreationPort } from "./model/ports";
import { useAddContactDrawerViewModel } from "./useAddContactDrawerViewModel";

jest.mock("@features/platform-contacts", () => ({
  ...jest.requireActual("@features/platform-contacts"),
  useContacts: jest.fn(),
}));

const mockedUseContacts = jest.mocked(useContacts);

describe("useAddContactDrawerViewModel", () => {
  beforeEach(() => {
    mockedUseContacts.mockReturnValue([]);
  });

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
      result.current.onDraftNameChange("Ada1");
    });

    expect(result.current).toMatchObject({
      invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
      isConfirmEnabled: false,
    });

    act(() => {
      result.current.onDraftNameChange("Ada");
    });

    expect(result.current.avatarInitial).toBe("A");

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(contactCreation.createContact).toHaveBeenCalledWith({ name: "Ada" });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      isOpen: false,
      draftName: "",
      isConfirmEnabled: false,
      invalidNameError: null,
    });
  });

  it("should limit the saved contact name to 32 characters", async () => {
    const onSaveSuccess = jest.fn();
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(async ({ name }) =>
        contact({
          id: "contact-long-name",
          isMe: false,
          name,
          addresses: [],
        }),
      ),
    };
    const { result } = renderHook(() =>
      useAddContactDrawerViewModel({ contactCreation, onSaveSuccess }),
    );
    const name = "a".repeat(33);

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange(name);
    });

    expect(result.current.draftName).toBe("a".repeat(32));

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(contactCreation.createContact).toHaveBeenCalledWith({ name: "a".repeat(32) });
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it("should not expose a duplicate error while saving a newly created contact", async () => {
    let contacts = [mockMeContact()];
    const createdContact = mockContact({ id: "contact-ada", name: "Ada" });
    let resolveCreation: (contact: typeof createdContact) => void;
    const creation = new Promise<typeof createdContact>(resolve => {
      resolveCreation = resolve;
    });
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(async () => {
        contacts = [...contacts, createdContact];
        return creation;
      }),
    };
    mockedUseContacts.mockImplementation(() => contacts);
    const { result, rerender } = renderHook(() =>
      useAddContactDrawerViewModel({ contactCreation, onSaveSuccess: jest.fn() }),
    );

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada");
    });

    act(() => {
      void result.current.onConfirm();
    });
    rerender();

    expect(result.current).toMatchObject({
      isSaving: true,
      invalidNameError: null,
    });

    await act(async () => {
      resolveCreation(createdContact);
      await creation;
    });

    expect(result.current.isOpen).toBe(false);
  });
});
