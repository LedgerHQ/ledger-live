import {
  defaultLargeScreenUpsellModalState,
  LargeScreenUpsellModalStateSchema,
  MAX_DATE_MS,
  RestorableLargeScreenUpsellModalStateSchema,
} from "./schema";

const restorableDefaults = {
  retriesModal: defaultLargeScreenUpsellModalState.retriesModal,
  lastSeenAt: defaultLargeScreenUpsellModalState.lastSeenAt,
};

describe("LargeScreenUpsellModalStateSchema", () => {
  it.each([
    { retriesModal: 0, lastSeenAt: null, session: "ready" as const },
    {
      retriesModal: 3,
      lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
      session: "dismissed" as const,
    },
    {
      retriesModal: Number.MAX_SAFE_INTEGER,
      lastSeenAt: MAX_DATE_MS,
      session: "blockedByCompeting" as const,
    },
  ])("accepts $retriesModal retries with lastSeenAt $lastSeenAt", state => {
    expect(LargeScreenUpsellModalStateSchema.parse(state)).toEqual(state);
  });

  it.each([
    { field: "retriesModal", value: -1 },
    { field: "retriesModal", value: 1.5 },
    { field: "retriesModal", value: Number.MAX_SAFE_INTEGER + 1 },
    { field: "retriesModal", value: "2" },
    { field: "lastSeenAt", value: -1 },
    { field: "lastSeenAt", value: 1.5 },
    { field: "lastSeenAt", value: MAX_DATE_MS + 1 },
    { field: "lastSeenAt", value: Number.MAX_SAFE_INTEGER },
    { field: "lastSeenAt", value: Number.MAX_SAFE_INTEGER + 1 },
    { field: "lastSeenAt", value: "2026-07-01" },
    { field: "session", value: "pending" },
    { field: "session", value: true },
  ])("rejects $field of $value", ({ field, value }) => {
    const state = {
      retriesModal: 0,
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
        retriesModal: 2,
        lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
        session: "dismissed",
      }),
    ).toEqual({
      retriesModal: 2,
      lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
    });
  });

  it("ignores legacy retries and defaults retriesModal to 0", () => {
    expect(
      RestorableLargeScreenUpsellModalStateSchema.parse({
        retries: 3,
        lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
      }),
    ).toEqual({
      retriesModal: 0,
      lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
    });
  });
});
