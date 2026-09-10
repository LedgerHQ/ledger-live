import { canSkipRecipientStep, hasDirectRecipient } from "../types";

describe("hasDirectRecipient", () => {
  it("should require skip and a non-empty recipient", () => {
    expect(hasDirectRecipient(undefined)).toBe(false);
    expect(hasDirectRecipient({ skipRecipientStep: true })).toBe(false);
    expect(hasDirectRecipient({ recipient: "rAddress", skipRecipientStep: true })).toBe(true);
    expect(hasDirectRecipient({ recipient: "   ", skipRecipientStep: true })).toBe(false);
    expect(hasDirectRecipient({ recipient: "rAddress", skipRecipientStep: false })).toBe(false);
  });
});

describe("canSkipRecipientStep", () => {
  const skip = { recipient: "rAddress", skipRecipientStep: true as const };

  it("should skip only when the currency does not require a memo", () => {
    expect(canSkipRecipientStep(skip, { hasMemo: false })).toBe(true);
    expect(canSkipRecipientStep(skip, { hasMemo: true })).toBe(false);
  });

  it("should not skip without a direct recipient", () => {
    expect(canSkipRecipientStep({ skipRecipientStep: true }, { hasMemo: false })).toBe(false);
    expect(canSkipRecipientStep({ recipient: "rAddress" }, { hasMemo: false })).toBe(false);
  });
});
