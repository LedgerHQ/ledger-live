import { resolveRemoteCopy } from "../resolveRemoteCopy";

const FALLBACK = "Default label";

describe("resolveRemoteCopy", () => {
  it("returns fallback when flag is disabled", () => {
    expect(resolveRemoteCopy(false, true, "Custom", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback when enabled is undefined", () => {
    expect(resolveRemoteCopy(undefined, true, "Custom", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback when locale is not EN", () => {
    expect(resolveRemoteCopy(true, false, "Custom", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback when param is undefined", () => {
    expect(resolveRemoteCopy(true, true, undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback when param is an empty string", () => {
    expect(resolveRemoteCopy(true, true, "", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback when param is whitespace-only", () => {
    expect(resolveRemoteCopy(true, true, "   ", FALLBACK)).toBe(FALLBACK);
  });

  it("returns param value when flag is enabled and locale is EN", () => {
    expect(resolveRemoteCopy(true, true, "Custom", FALLBACK)).toBe("Custom");
  });

  it("preserves surrounding whitespace in a valid param", () => {
    expect(resolveRemoteCopy(true, true, " Custom ", FALLBACK)).toBe(" Custom ");
  });
});
