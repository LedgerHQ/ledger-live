import { isValidatorRemoved } from "../utils";

describe("isValidatorRemoved", () => {
  it("returns true when done loading, without error, no validator and a numeric nodeId", () => {
    expect(
      isValidatorRemoved({ loading: false, error: null, hasValidator: false, nodeId: 3 }),
    ).toBe(true);
  });

  it("returns false while loading", () => {
    expect(isValidatorRemoved({ loading: true, error: null, hasValidator: false, nodeId: 3 })).toBe(
      false,
    );
  });

  it("returns false when the validators fetch failed", () => {
    expect(
      isValidatorRemoved({
        loading: false,
        error: new Error("network down"),
        hasValidator: false,
        nodeId: 3,
      }),
    ).toBe(false);
  });

  it("returns false when the validator is present", () => {
    expect(isValidatorRemoved({ loading: false, error: null, hasValidator: true, nodeId: 3 })).toBe(
      false,
    );
  });

  it("returns false when there is no delegated nodeId", () => {
    expect(
      isValidatorRemoved({ loading: false, error: null, hasValidator: false, nodeId: undefined }),
    ).toBe(false);
  });

  it("returns true when loading is undefined, without error, no validator and a numeric nodeId", () => {
    expect(
      isValidatorRemoved({ loading: undefined, error: null, hasValidator: false, nodeId: 3 }),
    ).toBe(true);
  });
});
