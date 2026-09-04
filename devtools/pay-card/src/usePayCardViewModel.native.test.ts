import { renderHook } from "@support/jest-devtools/native";
import { usePayCardViewModel } from "./usePayCardViewModel";
import type { OnboardingStep, PayCardToolProps } from "./types";

// Mobile step set: same as desktop plus the mobile-only Apple/Google Pay step.
const DEFAULT_STEPS: OnboardingStep[] = [
  { id: "create-account", label: "Create account", done: false },
  { id: "choose-card-type", label: "Choose card type", done: false },
  { id: "top-up-card", label: "Top up card", done: false },
  { id: "apple-google-pay", label: "Apple/Google Pay", done: false },
  { id: "first-purchase", label: "First purchase", done: false },
];

function buildProps(overrides: Partial<PayCardToolProps> = {}): PayCardToolProps {
  return {
    flags: {
      payTabEnabled: false,
      cardParam: false,
      ptxCardEnabled: false,
      setPayTabEnabled: jest.fn(),
      setCardParam: jest.fn(),
      setPtxCardEnabled: jest.fn(),
      ...overrides.flags,
    },
    onboarding: {
      steps: DEFAULT_STEPS,
      setStepDone: jest.fn(),
      ...overrides.onboarding,
    },
    interaction: { probes: [], ...overrides.interaction },
    hasSeenFeatureTour: overrides.hasSeenFeatureTour ?? false,
    resetPayCardFeatureTourSeen: overrides.resetPayCardFeatureTourSeen ?? jest.fn(),
    hasSeenReceiveVerifyHint: overrides.hasSeenReceiveVerifyHint ?? false,
    resetReceiveVerifyHintSeen: overrides.resetReceiveVerifyHintSeen ?? jest.fn(),
    hasCompletedCardOnboarding: overrides.hasCompletedCardOnboarding ?? false,
    resetCardOnboarding: overrides.resetCardOnboarding ?? jest.fn(),
    env: overrides.env ?? { vars: [], setVar: jest.fn() },
  };
}

describe("usePayCardViewModel (native)", () => {
  it("exposes the mobile step set including the wallet-pay step", () => {
    const { result } = renderHook(() => usePayCardViewModel(buildProps()));
    expect(result.current.totalCount).toBe(5);
    expect(result.current.steps.map(step => step.id)).toContain("apple-google-pay");
    expect(result.current.allDone).toBe(false);
  });

  it("reports allDone when every step is done", () => {
    const steps = DEFAULT_STEPS.map(step => ({ ...step, done: true }));
    const { result } = renderHook(() =>
      usePayCardViewModel(buildProps({ onboarding: { steps, setStepDone: jest.fn() } })),
    );
    expect(result.current.allDone).toBe(true);
  });

  it("toggleStep flips the mobile-only step", () => {
    const props = buildProps();
    const { result } = renderHook(() => usePayCardViewModel(props));
    result.current.toggleStep("apple-google-pay");
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("apple-google-pay", true);
  });

  it("setAllSteps updates every not-done step", () => {
    const props = buildProps();
    const { result } = renderHook(() => usePayCardViewModel(props));
    result.current.setAllSteps(true);
    expect(props.onboarding.setStepDone).toHaveBeenCalledTimes(5);
  });
});
