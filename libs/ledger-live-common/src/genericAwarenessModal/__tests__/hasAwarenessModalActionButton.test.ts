import { hasAwarenessModalActionButton } from "../hasAwarenessModalActionButton";

describe("hasAwarenessModalActionButton", () => {
  it.each([
    ["Primary", "https://example.com", true],
    ["", "https://example.com", false],
    ["Primary", "", false],
    ["", "", false],
    ["   ", "https://example.com", false],
    ["Primary", "   ", false],
    ["  Primary  ", "  https://example.com  ", true],
  ] as const)("should return %s when label is %j and link is %j", (label, link, expected) => {
    expect(hasAwarenessModalActionButton(label, link)).toBe(expected);
  });
});
