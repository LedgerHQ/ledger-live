import {
  defaultLargeScreenUpsellModalState,
  LargeScreenUpsellModalStateSchema,
  RestorableLargeScreenUpsellModalStateSchema,
} from "./schema";

const restorableDefaults = {
  retries: defaultLargeScreenUpsellModalState.retries,
  lastSeenAt: defaultLargeScreenUpsellModalState.lastSeenAt,
};

describe("LargeScreenUpsellModalStateSchema", () => {
  it.each([
    { retries: 0, lastSeenAt: null, session: "ready" as const },
    {
      retries: 3,
      lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
      session: "dismissed" as const,
    },
    {
      retries: Number.MAX_SAFE_INTEGER,
      lastSeenAt: Number.MAX_SAFE_INTEGER,
      session: "blockedByCompeting" as const,
    },
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
    { field: "session", value: "pending" },
    { field: "session", value: true },
  ])("rejects $field of $value", ({ field, value }) => {
    const state = {
      retries: 0,
      lastSeenAt: null,
      session: "ready" as const,
      [field]: value,
    };

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
        restorableDefaults,
      );
    },
  );

  it("strips ephemeral session from a persisted payload", () => {
    expect(
      RestorableLargeScreenUpsellModalStateSchema.parse({
        retries: 2,
        lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
        session: "dismissed",
      }),
    ).toEqual({
      retries: 2,
      lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
    });
  });
});
