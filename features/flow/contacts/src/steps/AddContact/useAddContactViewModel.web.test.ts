import { renderHook, act } from "@testing-library/react";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  contact,
} from "@domain/entity-contact";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContacts } from "../../hooks";
import type { ContactCreationPort } from "./model/ports";
import { useAddContactViewModel } from "./useAddContactViewModel";

jest.mock("../../hooks", () => ({ useContacts: jest.fn() }));

const mockedUseContacts = jest.mocked(useContacts);

describe("useAddContactViewModel", () => {
  beforeEach(() => {
    mockedUseContacts.mockReturnValue([mockMeContact(), mockContact({ name: "Ada" })]);
  });
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
      invalidNameError: null,
      isSaveEnabled: true,
    });
  });

  it("exposes the stable invalid name error when the draft name is invalid", () => {
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(),
    };
    const { result } = renderHook(() => useAddContactViewModel(contactCreation));

    act(() => {
      result.current.setDraftName("Olive2");
    });

    expect(result.current.invalidNameError).toBe(INVALID_CONTACT_NAME_ERROR_NAME);
    expect(result.current.isSaveEnabled).toBe(false);
  });

  it("blocks a duplicate contact name from the current Contacts state", () => {
    const contactCreation: ContactCreationPort = {
      createContact: jest.fn(),
    };
    const { result } = renderHook(() => useAddContactViewModel(contactCreation));

    act(() => {
      result.current.setDraftName(" ada ");
    });

    expect(result.current.invalidNameError).toBe(DUPLICATE_CONTACT_NAME_ERROR_NAME);
    expect(result.current.isSaveEnabled).toBe(false);
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
