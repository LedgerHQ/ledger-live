import { getLargeScreenUpsellEligibility } from "./getLargeScreenUpsellEligibility";
import type {
  LargeScreenUpsellEligibilityContext,
  LargeScreenUpsellEligibilityUserState,
} from "../types";

const now = new Date("2026-07-15T12:00:00.000Z");

const baseUserState: LargeScreenUpsellEligibilityUserState = {
  seenNanoModelIds: ["nanoX"],
  hasSeenTouchscreenDevice: false,
  onboardingDate: new Date("2026-06-01T12:00:00.000Z"),
};

const baseContext: LargeScreenUpsellEligibilityContext = {
  audienceModels: { nanoS: true, nanoSP: true, nanoX: true },
  cooldownDays: { default: 30, nanoS: 0 },
  now,
};

describe("getLargeScreenUpsellEligibility", () => {
  it.each<{
    description: string;
    userState?: Partial<LargeScreenUpsellEligibilityUserState>;
    context?: Partial<LargeScreenUpsellEligibilityContext>;
    expected: ReturnType<typeof getLargeScreenUpsellEligibility>;
  }>([
    {
      description: "a touchscreen device has been seen",
      userState: { hasSeenTouchscreenDevice: true },
      expected: { isEligible: false, reason: "touchscreen_seen" },
    },
    {
      description: "no nano has been seen",
      userState: { seenNanoModelIds: [] },
      expected: { isEligible: false, reason: "no_nano" },
    },
    {
      description: "the only seen nano is disabled for the audience",
      userState: { seenNanoModelIds: ["nanoS"] },
      context: { audienceModels: { nanoS: false, nanoSP: true, nanoX: true } },
      expected: { isEligible: false, reason: "model_disabled" },
    },
    {
      description: "the only seen nano is nanoSP",
      userState: { seenNanoModelIds: ["nanoSP"] },
      expected: { isEligible: true, deviceModelId: "nanoSP" },
    },
    {
      description: "the only seen nano is nanoS",
      userState: { seenNanoModelIds: ["nanoS"] },
      expected: { isEligible: true, deviceModelId: "nanoS" },
    },
    {
      description: "several nanos are seen, the one with the longest cooldown is selected",
      userState: { seenNanoModelIds: ["nanoS", "nanoSP", "nanoX"] },
      expected: { isEligible: true, deviceModelId: "nanoSP" },
    },
    {
      description: "the cooldown hasn't elapsed",
      userState: {
        seenNanoModelIds: ["nanoS", "nanoX"],
        onboardingDate: new Date("2026-07-14T12:00:00.000Z"),
      },
      expected: { isEligible: false, reason: "cooldown", deviceModelId: "nanoX" },
    },
    {
      description: "the onboarding date is null",
      userState: { onboardingDate: null },
      expected: { isEligible: true, deviceModelId: "nanoX" },
    },
  ])("resolves as expected when $description", ({ userState, context, expected }) => {
    expect(
      getLargeScreenUpsellEligibility(
        { ...baseUserState, ...userState },
        { ...baseContext, ...context },
      ),
    ).toEqual(expected);
  });
});
