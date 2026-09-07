import { act, renderHook } from "@testing-library/react";
import {
  contact,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { useContacts } from "@features/platform-contacts";
import type { ContactCreationPort } from "./model/ports";
import { useAddContactDialogViewModel } from "./useAddContactDialogViewModel";
import type { AddContactDialogLifecycleCallbacks } from "./types";

jest.mock("@features/platform-contacts", () => ({
  getContactInitial: (name: string) => name.slice(0, 1),
  useContacts: jest.fn(),
}));

const mockedUseContacts = jest.mocked(useContacts);

const labels = {
  title: "Add contact",
  namePlaceholder: "Contact name",
  namingDisclaimer: "Use a nickname.",
  confirmName: "Confirm name",
  nameValidationErrors: {
    [INVALID_CONTACT_NAME_ERROR_NAME]: "Invalid name",
    [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "Duplicate name",
  },
} as const;

function renderViewModel(
  callbacks?: AddContactDialogLifecycleCallbacks,
  onSaveSuccess = jest.fn(),
) {
  const contactCreation: ContactCreationPort = {
    createContact: jest.fn(async ({ name }) =>
      contact({ id: "contact-ada", isMe: false, name, addresses: [] }),
    ),
  };
  const rendered = renderHook(() =>
    useAddContactDialogViewModel({ contactCreation, labels, onSaveSuccess, callbacks }),
  );

  return { ...rendered, contactCreation, onSaveSuccess };
}

describe("useAddContactDialogViewModel", () => {
  beforeEach(() => {
    mockedUseContacts.mockReturnValue([]);
  });

  it("should open and close through the injected lifecycle callbacks", () => {
    const callbacks = { onOpen: jest.fn(), onClose: jest.fn() };
    const { result } = renderViewModel(callbacks);

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);
    expect(callbacks.onOpen).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onDraftNameChange("Ada");
      result.current.onClose();
    });

    expect(result.current).toMatchObject({ isOpen: false, draftName: "" });
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it("should not confirm or notify while the name is invalid", async () => {
    const callbacks = { onConfirm: jest.fn() };
    const { result, contactCreation } = renderViewModel(callbacks);

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada@1");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(callbacks.onConfirm).not.toHaveBeenCalled();
    expect(contactCreation.createContact).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it("should confirm, save, close, and report success for a valid name", async () => {
    const callbacks = { onConfirm: jest.fn() };
    const { result, contactCreation, onSaveSuccess } = renderViewModel(callbacks);

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(callbacks.onConfirm).toHaveBeenCalledTimes(1);
    expect(contactCreation.createContact).toHaveBeenCalledWith({ name: "Ada" });
    expect(onSaveSuccess).toHaveBeenCalledWith(expect.objectContaining({ name: "Ada" }));
    expect(result.current.isOpen).toBe(false);
  });

  it("should report an invalid name error once while it is visible", () => {
    const callbacks = { onInvalidNameErrorDisplayed: jest.fn() };
    const { result } = renderViewModel(callbacks);

    act(() => {
      result.current.onOpen();
      result.current.onDraftNameChange("Ada@1");
    });

    expect(callbacks.onInvalidNameErrorDisplayed).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onDraftNameChange("Ada@1!");
    });

    expect(callbacks.onInvalidNameErrorDisplayed).toHaveBeenCalledTimes(1);
  });
});
