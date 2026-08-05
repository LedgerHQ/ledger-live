import { resolveStoredPolicyInspectorStatus } from "./inspector";

const v1 = { major: 1, minor: 0, normalized: "1.0" };
const v2 = { major: 2, minor: 0, normalized: "2.0" };

describe("resolveStoredPolicyInspectorStatus", () => {
  it("returns Missing when nothing is saved", () => {
    expect(resolveStoredPolicyInspectorStatus(null, null, v1)).toEqual({
      label: "Missing",
      tone: "error",
    });
  });

  it("returns Invalid when the saved value does not parse", () => {
    expect(resolveStoredPolicyInspectorStatus("not-a-version", null, v1)).toEqual({
      label: "Invalid",
      tone: "error",
    });
  });

  it("returns Valid when stored matches remote", () => {
    expect(resolveStoredPolicyInspectorStatus("1.0", v1, v1)).toEqual({
      label: "Valid",
      tone: "success",
    });
  });

  it("returns Valid · outdated when stored is behind a valid remote", () => {
    expect(resolveStoredPolicyInspectorStatus("1.0", v1, v2)).toEqual({
      label: "Valid · outdated",
      tone: "warning",
    });
  });

  it("returns Valid when remote is invalid even if stored is older", () => {
    expect(resolveStoredPolicyInspectorStatus("1.0", v1, null)).toEqual({
      label: "Valid",
      tone: "success",
    });
  });
});
