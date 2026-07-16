import {
  defaultLargeScreenUpsellModalState,
  LargeScreenUpsellModalStateSchema,
  RestorableLargeScreenUpsellModalStateSchema,
} from "./schema";

describe("LargeScreenUpsellModalStateSchema", () => {
  it.each([
    { retries: 0, lastSeenAt: null },
    { retries: 3, lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z") },
    { retries: Number.MAX_SAFE_INTEGER, lastSeenAt: Number.MAX_SAFE_INTEGER },
  ])("accepts $retries retries with lastSeenAt $lastSeenAt", state => {
    expect(LargeScreenUpsellModalStateSchema.parse(state)).toEqual(state);
  });

  it.each([
    { field: "retries", value: -1 },
    { field: "retries", value: 1.5 },
    { field: "retries", value: Number.MAX_SAFE_INTEGER + 1 },
    { field: "retries", value: "2" },
    { field: "lastSeenAt", value: -1 },
    { field: "lastSeenAt", value: 1.5 },
    { field: "lastSeenAt", value: Number.MAX_SAFE_INTEGER + 1 },
    { field: "lastSeenAt", value: "2026-07-01" },
  ])("rejects $field of $value", ({ field, value }) => {
    const state = { retries: 0, lastSeenAt: null, [field]: value };

    expect(() => LargeScreenUpsellModalStateSchema.parse(state)).toThrow();
  });

  it("rejects a state missing required fields", () => {
    expect(() => LargeScreenUpsellModalStateSchema.parse({})).toThrow();
  });
});

describe("RestorableLargeScreenUpsellModalStateSchema", () => {
  it.each([null, undefined, "not-an-object", [1, 2, 3], 42])(
    "falls back to defaults given the non-object payload %p",
    payload => {
      expect(RestorableLargeScreenUpsellModalStateSchema.parse(payload)).toEqual(
        defaultLargeScreenUpsellModalState,
      );
    },
  );
});
