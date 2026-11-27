import { isMemoValidationPending } from "../isMemoValidationPending";

describe("isMemoValidationPending", () => {
  it("is pending while the bridge validates a typed memo", () => {
    expect(
      isMemoValidationPending({
        hasMemo: true,
        memo: { value: "12345", type: "MEMO_TEXT" },
        bridgePending: true,
      }),
    ).toBe(true);
  });

  it("is not pending once the bridge status is up to date", () => {
    expect(
      isMemoValidationPending({
        hasMemo: true,
        memo: { value: "12345", type: "MEMO_TEXT" },
        bridgePending: false,
      }),
    ).toBe(false);
  });

  it("is not pending when the currency has no memo", () => {
    expect(
      isMemoValidationPending({
        hasMemo: false,
        memo: { value: "12345" },
        bridgePending: true,
      }),
    ).toBe(false);
  });

  it("is not pending for an empty or skipped memo, which goes through the skip-memo flow", () => {
    expect(
      isMemoValidationPending({ hasMemo: true, memo: { value: "" }, bridgePending: true }),
    ).toBe(false);
    expect(
      isMemoValidationPending({
        hasMemo: true,
        memo: { value: "", type: "NO_MEMO" },
        bridgePending: true,
      }),
    ).toBe(false);
    expect(isMemoValidationPending({ hasMemo: true, memo: undefined, bridgePending: true })).toBe(
      false,
    );
  });
});
