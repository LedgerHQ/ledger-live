import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";
import { formatTestContactDisplayName } from "../testing/ContactsI18nTestProvider";

describe("formatContactDisplayName", () => {
  it("should show my addresses (me) when the me contact was never renamed", () => {
    expect(formatTestContactDisplayName({ name: DEFAULT_ME_CONTACT_NAME, isMe: true })).toBe(
      "My addresses (Me)",
    );
  });

  it("should suffix a renamed me contact with (me)", () => {
    expect(formatTestContactDisplayName({ name: "Alice", isMe: true })).toBe("Alice (Me)");
  });

  it("should show other contacts by their name", () => {
    expect(formatTestContactDisplayName({ name: "Bob", isMe: false })).toBe("Bob");
  });
});
