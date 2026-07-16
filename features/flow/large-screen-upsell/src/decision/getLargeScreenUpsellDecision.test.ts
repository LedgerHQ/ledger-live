import { getLargeScreenUpsellDecision } from "./getLargeScreenUpsellDecision";
import type { LargeScreenUpsellContext, LargeScreenUpsellUserState } from "../types";

const now = new Date("2026-07-15T12:00:00.000Z");

const baseUserState: LargeScreenUpsellUserState = {
  seenNanoModelIds: ["nanoX"],
  hasSeenTouchscreenDevice: false,
  onboardingDate: new Date("2026-06-01T12:00:00.000Z"),
  frequency: { retries: 0, lastSeenAt: null },
};

const baseContext: LargeScreenUpsellContext = {
  isFeatureEnabled: true,
  isModalEnabled: true,
  audienceModels: { nanoS: true, nanoSP: true, nanoX: true },
  cooldownDays: { default: 30, nanoS: 0 },
  killThreshold: 3,
  cadenceDays: 30,
  now,
};

describe("getLargeScreenUpsellDecision", () => {
  it.each<{
    description: string;
    userState?: Partial<LargeScreenUpsellUserState>;
    context?: Partial<LargeScreenUpsellContext>;
    expected: ReturnType<typeof getLargeScreenUpsellDecision>;
  }>([
    {
      description: "the feature flag is disabled",
      context: { isFeatureEnabled: false },
      expected: { shouldShow: false, reason: "feature_disabled" },
    },
    {
      description: "the modal sub-toggle is disabled",
      context: { isModalEnabled: false },
      expected: { shouldShow: false, reason: "modal_disabled" },
    },
    {
      description: "a touchscreen device has been seen",
      userState: { hasSeenTouchscreenDevice: true },
      expected: { shouldShow: false, reason: "touchscreen_seen" },
    },
    {
      description: "no nano has been seen",
      userState: { seenNanoModelIds: [] },
      expected: { shouldShow: false, reason: "no_nano" },
    },
    {
      description: "the only seen nano is disabled for the audience",
      userState: { seenNanoModelIds: ["nanoS"] },
      context: { audienceModels: { nanoS: false, nanoSP: true, nanoX: true } },
      expected: { shouldShow: false, reason: "model_disabled" },
    },
    {
      description: "the only seen nano is nanoSP",
      userState: { seenNanoModelIds: ["nanoSP"] },
      expected: { shouldShow: true, deviceModelId: "nanoSP" },
    },
    {
      description: "the only seen nano is nanoS",
      userState: { seenNanoModelIds: ["nanoS"] },
      expected: { shouldShow: true, deviceModelId: "nanoS" },
    },
    {
      description: "several nanos are seen, the one with the longest cooldown is selected",
      userState: { seenNanoModelIds: ["nanoS", "nanoSP", "nanoX"] },
      expected: { shouldShow: true, deviceModelId: "nanoSP" },
    },
    {
      description: "several nanos are seen but only one is enabled for the audience",
      userState: { seenNanoModelIds: ["nanoS", "nanoSP"] },
      context: { audienceModels: { nanoS: false, nanoSP: true, nanoX: true } },
      expected: { shouldShow: true, deviceModelId: "nanoSP" },
    },
    {
      description: "the cooldown hasn't elapsed",
      userState: {
        seenNanoModelIds: ["nanoS", "nanoX"],
        onboardingDate: new Date("2026-07-14T12:00:00.000Z"),
      },
      expected: { shouldShow: false, reason: "cooldown", deviceModelId: "nanoX" },
    },
    {
      description: "the onboarding date is null",
      userState: { onboardingDate: null },
      expected: { shouldShow: false, reason: "cooldown", deviceModelId: "nanoX" },
    },
    {
      description: "eligible and never displayed before",
      expected: { shouldShow: true, deviceModelId: "nanoX" },
    },
    {
      description: "under the kill threshold regardless of last display",
      userState: { frequency: { retries: 2, lastSeenAt: Date.parse("2026-07-14T12:00:00.000Z") } },
      expected: { shouldShow: true, deviceModelId: "nanoX" },
    },
    {
      description: "past the kill threshold and within the cadence window",
      userState: { frequency: { retries: 3, lastSeenAt: Date.parse("2026-07-14T12:00:00.000Z") } },
      expected: { shouldShow: false, reason: "throttled", deviceModelId: "nanoX" },
    },
    {
      description: "past the kill threshold but the cadence window has elapsed",
      userState: { frequency: { retries: 3, lastSeenAt: Date.parse("2026-05-01T12:00:00.000Z") } },
      expected: { shouldShow: true, deviceModelId: "nanoX" },
    },
  ])("resolves as expected when $description", ({ userState, context, expected }) => {
    expect(
      getLargeScreenUpsellDecision(
        { ...baseUserState, ...userState },
        { ...baseContext, ...context },
      ),
    ).toEqual(expected);
  });

  it("picks the same deviceModelId for tied cooldowns regardless of seenNanoModelIds order", () => {
    const context = { ...baseContext };
    const forward = getLargeScreenUpsellDecision(
      { ...baseUserState, seenNanoModelIds: ["nanoSP", "nanoX"] },
      context,
    );
    const reverse = getLargeScreenUpsellDecision(
      { ...baseUserState, seenNanoModelIds: ["nanoX", "nanoSP"] },
      context,
    );

    expect(forward).toEqual({ shouldShow: true, deviceModelId: "nanoSP" });
    expect(reverse).toEqual(forward);
  });
});
