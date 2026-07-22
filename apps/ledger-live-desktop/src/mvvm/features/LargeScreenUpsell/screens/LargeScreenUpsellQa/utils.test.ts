import {
  buildUpsellGateRows,
  calendarDaysBetween,
  daysAgoDate,
  daysAgoIso,
  isPostOnboardingCooldownPassed,
  isThrottleGatePassed,
  parseNonNegativeInteger,
  pastCooldownOffsetDays,
  draftDisplayFromEffective,
  resolveParamBaseline,
} from "./utils";

describe("LargeScreenUpsellQa utils", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("parses non-negative integers and builds days-ago ISO", () => {
    expect(parseNonNegativeInteger("3")).toBe(3);
    expect(parseNonNegativeInteger("-1")).toBeUndefined();
    expect(parseNonNegativeInteger("1.5")).toBeUndefined();

    jest.useFakeTimers().setSystemTime(new Date("2026-07-17T08:00:00.000Z"));
    expect(daysAgoIso(45)).toBe("2026-06-02T12:00:00.000Z");
  });

  it("pastCooldownOffsetDays mirrors cooldownDays so the gate passes (>=)", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-17T12:00:00.000Z"));

    expect(pastCooldownOffsetDays(30)).toBe(30);
    expect(pastCooldownOffsetDays(0)).toBe(0);
    expect(pastCooldownOffsetDays(-5)).toBe(0);

    const now = new Date();
    expect(
      isPostOnboardingCooldownPassed({
        onboardingDate: daysAgoDate(pastCooldownOffsetDays(30)),
        cooldownDays: 30,
        now,
      }),
    ).toBe(true);
    expect(
      isPostOnboardingCooldownPassed({
        onboardingDate: daysAgoDate(pastCooldownOffsetDays(0)),
        cooldownDays: 0,
        now,
      }),
    ).toBe(true);
  });

  it("resolveParamBaseline prefers remote, else schema; flags override", () => {
    expect(
      resolveParamBaseline({
        effective: 30,
        schemaDefault: 30,
        hasLocalOverride: false,
      }),
    ).toEqual({ baseline: "30", baselineValue: 30, isOverridden: false });

    expect(
      resolveParamBaseline({
        effective: 45,
        schemaDefault: 30,
        hasLocalOverride: false,
      }),
    ).toEqual({ baseline: "45", baselineValue: 45, isOverridden: false });

    expect(
      resolveParamBaseline({
        effective: 10,
        schemaDefault: 30,
        hasLocalOverride: true,
      }),
    ).toEqual({ baseline: "30", baselineValue: 30, isOverridden: true });

    expect(
      resolveParamBaseline({
        effective: true,
        schemaDefault: false,
        hasLocalOverride: false,
      }),
    ).toEqual({ baseline: "on", baselineValue: true, isOverridden: false });

    expect(
      resolveParamBaseline({
        effective: 5,
        schemaDefault: undefined,
        hasLocalOverride: true,
      }),
    ).toEqual({ baseline: "-", baselineValue: undefined, isOverridden: true });
  });

  it("draftDisplayFromEffective leaves input empty when unset or at baseline", () => {
    expect(draftDisplayFromEffective(3, "3")).toBe("");
    expect(draftDisplayFromEffective(undefined, "-")).toBe("");
    expect(draftDisplayFromEffective(null, "30")).toBe("");
    expect(draftDisplayFromEffective(10, "3")).toBe("10");
    expect(draftDisplayFromEffective(0, "0")).toBe("");
    expect(draftDisplayFromEffective(0, "30")).toBe("0");
  });

  it("mirrors post-onboarding cooldown: null date is treated as today", () => {
    const now = new Date("2026-07-17T12:00:00.000Z");

    expect(
      isPostOnboardingCooldownPassed({
        onboardingDate: null,
        cooldownDays: 30,
        now,
      }),
    ).toBe(false);

    expect(
      isPostOnboardingCooldownPassed({
        onboardingDate: new Date("2026-06-01T12:00:00.000Z"),
        cooldownDays: 30,
        now,
      }),
    ).toBe(true);

    expect(calendarDaysBetween(now, new Date("2026-07-10T12:00:00.000Z"))).toBe(7);
  });

  it("marks the first failing gate as blocking", () => {
    const rows = buildUpsellGateRows({
      isFeatureEnabled: true,
      isModalEnabled: true,
      hasSeenTouchscreenDevice: false,
      hasNano: true,
      isModelInAudience: true,
      cooldownPassed: false,
      throttlePassed: true,
      blockingReason: "cooldown",
    });

    expect(rows.find(r => r.reason === "cooldown")).toEqual({
      reason: "cooldown",
      passes: false,
      isBlocking: true,
    });
    expect(rows.filter(r => r.isBlocking)).toHaveLength(1);
  });

  it("evaluates throttle independently: high retries alone do not fail without lastSeen", () => {
    const now = new Date("2026-07-17T12:00:00.000Z");

    expect(
      isThrottleGatePassed({
        retries: 10,
        lastSeenAt: null,
        killThreshold: 3,
        cadenceDays: 30,
        now,
      }),
    ).toBe(true);

    expect(
      isThrottleGatePassed({
        retries: 10,
        lastSeenAt: Date.parse("2026-07-14T12:00:00.000Z"),
        killThreshold: 3,
        cadenceDays: 30,
        now,
      }),
    ).toBe(false);

    expect(
      isThrottleGatePassed({
        retries: 10,
        lastSeenAt: Date.parse("2026-05-01T12:00:00.000Z"),
        killThreshold: 3,
        cadenceDays: 30,
        now,
      }),
    ).toBe(true);

    expect(
      isThrottleGatePassed({
        retries: 2,
        lastSeenAt: Date.parse("2026-07-14T12:00:00.000Z"),
        killThreshold: 3,
        cadenceDays: 30,
        now,
      }),
    ).toBe(true);
  });

  it("keeps throttle fail independent of other gates when building rows", () => {
    const rows = buildUpsellGateRows({
      isFeatureEnabled: true,
      isModalEnabled: true,
      hasSeenTouchscreenDevice: false,
      hasNano: true,
      isModelInAudience: true,
      cooldownPassed: true,
      throttlePassed: false,
      blockingReason: "throttled",
    });

    expect(rows.find(r => r.reason === "throttled")).toEqual({
      reason: "throttled",
      passes: false,
      isBlocking: true,
    });
    expect(rows.filter(r => r.passes)).toHaveLength(6);
  });
});
