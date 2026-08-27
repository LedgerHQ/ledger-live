import { renderHook } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useContactsViewModel } from "../useContactsViewModel";
import { makeContactsWrapper } from "./shared";

describe("useContactsViewModel", () => {
  it("should be empty when the store holds no contact", () => {
    const { result } = renderHook(() => useContactsViewModel(), {
      wrapper: makeContactsWrapper([]),
    });

    expect(result.current.isEmpty).toBe(true);
  });

  it("should be empty when the me contact is the only one", () => {
    const { result } = renderHook(() => useContactsViewModel(), {
      wrapper: makeContactsWrapper([mockMeContact()]),
    });

    expect(result.current.isEmpty).toBe(true);
  });

  it("should not be empty when a saved contact exists", () => {
    const { result } = renderHook(() => useContactsViewModel(), {
      wrapper: makeContactsWrapper([
        mockMeContact(),
        mockContact({ id: "contact-ada", name: "Ada" }),
      ]),
    });

    expect(result.current.isEmpty).toBe(false);
  });
});
