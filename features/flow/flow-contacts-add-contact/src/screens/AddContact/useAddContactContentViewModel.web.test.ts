import { act, renderHook } from "@testing-library/react";
import { contact, INVALID_CONTACT_NAME_ERROR_NAME } from "@domain/entity-contact";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContacts } from "@features/platform-contacts";
import { CONTACT_NAME_MAX_LENGTH } from "../../components/ContactNameInput/constants";
import type { ContactCreationPort } from "./model/ports";
import { useAddContactContentViewModel } from "./useAddContactContentViewModel";

jest.mock("@features/platform-contacts", () => ({
  getContactInitial: (name: string) => name.slice(0, 1),
  useContacts: jest.fn(),
}));

const mockedUseContacts = jest.mocked(useContacts);

describe("useAddContactContentViewModel", () => {
  beforeEach(() => {
    mockedUseContacts.mockReturnValue([]);
  });

  it("should save through the injected port and return the created contact to the consumer", async () => {
    const createdContact = contact({ id: "contact-ada", isMe: false, name: "Ada", addresses: [] });
    const onSaveSuccess = jest.fn();
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(async () => createdContact),
    };
    const { result } = renderHook(() =>
      useAddContactContentViewModel({ contactCreation, onSaveSuccess }),
    );

    act(() => {
      result.current.onDraftNameChange("Ada@1");
    });

    expect(result.current).toMatchObject({
      invalidNameError: INVALID_CONTACT_NAME_ERROR_NAME,
      isConfirmEnabled: false,
    });

    act(() => {
      result.current.onDraftNameChange("Ada");
    });

    await act(async () => {
      await expect(result.current.onConfirm()).resolves.toBe(createdContact);
    });

    expect(contactCreation.createContact).toHaveBeenCalledWith({ name: "Ada" });
    expect(onSaveSuccess).toHaveBeenCalledWith(createdContact);
    expect(result.current.draftName).toBe("Ada");
  });

  it("should reset the draft when the consumer cancels the container", () => {
    const { result } = renderHook(() =>
      useAddContactContentViewModel({
        contactCreation: { createContact: jest.fn() },
        onSaveSuccess: jest.fn(),
      }),
    );

    act(() => {
      result.current.onDraftNameChange("Ada");
      result.current.reset();
    });

    expect(result.current.draftName).toBe("");
  });

  it("should limit the saved contact name to the maximum length", async () => {
    const createdContact = contact({ id: "contact-ada", isMe: false, name: "Ada", addresses: [] });
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(async () => createdContact),
    };
    const { result } = renderHook(() =>
      useAddContactContentViewModel({ contactCreation, onSaveSuccess: jest.fn() }),
    );
    const name = "a".repeat(CONTACT_NAME_MAX_LENGTH + 1);

    act(() => {
      result.current.onDraftNameChange(name);
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(contactCreation.createContact).toHaveBeenCalledWith({
      name: "a".repeat(CONTACT_NAME_MAX_LENGTH),
    });
  });

  it("should return the created contact when the success callback throws", async () => {
    const createdContact = contact({ id: "contact-ada", isMe: false, name: "Ada", addresses: [] });
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(async () => createdContact),
    };
    const { result } = renderHook(() =>
      useAddContactContentViewModel({
        contactCreation,
        onSaveSuccess: () => {
          throw new Error("consumer error");
        },
      }),
    );

    act(() => {
      result.current.onDraftNameChange("Ada");
    });

    await act(async () => {
      await expect(result.current.onConfirm()).resolves.toBe(createdContact);
    });
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
      useAddContactContentViewModel({ contactCreation, onSaveSuccess: jest.fn() }),
    );

    act(() => {
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

    act(() => {
      result.current.onDraftNameChange("Ada@1");
    });

    expect(result.current.draftName).toBe("Ada");

    await act(async () => {
      resolveCreation(createdContact);
      await creation;
    });

    expect(result.current.isSaving).toBe(false);
  });
});
