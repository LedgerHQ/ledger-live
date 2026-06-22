import { parseOverridesImport } from "./importOverrides";

describe("parseOverridesImport", () => {
  it("keeps a valid override with no warnings", () => {
    const overrides = { mockFeature: { enabled: true } };

    expect(parseOverridesImport(JSON.stringify(overrides))).toEqual({ overrides, warnings: [] });
  });

  it("throws when the payload is not a JSON object", () => {
    expect(() => parseOverridesImport("[1, 2]")).toThrow("expected a JSON object");
  });

  it("drops an unknown feature flag and warns", () => {
    const { overrides, warnings } = parseOverridesImport(
      JSON.stringify({ notAFlag: { enabled: true } }),
    );

    expect(overrides).toEqual({});
    expect(warnings).toEqual(['Ignored unknown feature flag "notAFlag"']);
  });

  it("drops a value that does not match its flag schema and warns", () => {
    const { overrides, warnings } = parseOverridesImport(JSON.stringify({ mockFeature: "nope" }));

    expect(overrides).toEqual({});
    expect(warnings).toEqual(['Ignored invalid value for "mockFeature"']);
  });
});
