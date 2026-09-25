import { renderHook } from "@testing-library/react";
import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";
import { ContactsI18nTestProvider } from "../testing/ContactsI18nTestProvider";
import { useContactDisplayName } from "./useContactDisplayName";

function renderDisplayName() {
  return renderHook(() => useContactDisplayName(), { wrapper: ContactsI18nTestProvider }).result
    .current;
}

describe("useContactDisplayName", () => {
  it("should show my addresses (me) when the me contact was never renamed", () => {
    expect(renderDisplayName()({ name: DEFAULT_ME_CONTACT_NAME, isMe: true })).toBe(
      "My addresses (Me)",
    );
  });

  it("should suffix a renamed me contact with (me)", () => {
    expect(renderDisplayName()({ name: "Alice", isMe: true })).toBe("Alice (Me)");
  });

  it("should show other contacts by their name", () => {
    expect(renderDisplayName()({ name: "Bob", isMe: false })).toBe("Bob");
  });
});
