import { renderHook } from "@testing-library/react";
import { formatId, usePayCardViewModel } from "./usePayCardViewModel";
import type { OnboardingStep, PayCardToolProps } from "./types";

// Desktop step set. The Apple/Google Pay step is mobile-only.
const DEFAULT_STEPS: OnboardingStep[] = [
  { id: "create-account", label: "Create account", done: false },
  { id: "choose-card-type", label: "Choose card type", done: false },
  { id: "top-up-card", label: "Top up card", done: false },
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

describe("formatId", () => {
  it("humanizes dashed and underscored ids", () => {
    expect(formatId("kyc-check")).toBe("Kyc check");
    expect(formatId("verification_phase")).toBe("Verification phase");
  });

  it("returns the original value when empty after normalization", () => {
    expect(formatId("")).toBe("");
  });
});

describe("usePayCardViewModel", () => {
  it("exposes the onboarding steps and totals", () => {
    const { result } = renderHook(() => usePayCardViewModel(buildProps()));
    expect(result.current.totalCount).toBe(4);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.allDone).toBe(false);
  });

  it("counts completed steps and reports allDone when every step is done", () => {
    const steps = DEFAULT_STEPS.map(step => ({ ...step, done: true }));
    const { result } = renderHook(() =>
      usePayCardViewModel(buildProps({ onboarding: { steps, setStepDone: jest.fn() } })),
    );
    expect(result.current.completedCount).toBe(4);
    expect(result.current.allDone).toBe(true);
  });

  it("is not allDone when there are no steps", () => {
    const { result } = renderHook(() =>
      usePayCardViewModel(buildProps({ onboarding: { steps: [], setStepDone: jest.fn() } })),
    );
    expect(result.current.allDone).toBe(false);
  });

  it("toggleStep flips a not-done step to done", () => {
    const props = buildProps();
    const { result } = renderHook(() => usePayCardViewModel(props));
    result.current.toggleStep("create-account");
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("create-account", true);
  });

  it("toggleStep flips a done step back to not-done", () => {
    const steps = DEFAULT_STEPS.map(step =>
      step.id === "create-account" ? { ...step, done: true } : step,
    );
    const props = buildProps({ onboarding: { steps, setStepDone: jest.fn() } });
    const { result } = renderHook(() => usePayCardViewModel(props));
    result.current.toggleStep("create-account");
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("create-account", false);
  });

  it("toggleStep ignores unknown step ids", () => {
    const props = buildProps();
    const { result } = renderHook(() => usePayCardViewModel(props));
    result.current.toggleStep("does-not-exist");
    expect(props.onboarding.setStepDone).not.toHaveBeenCalled();
  });

  it("setAllSteps only updates steps whose state changes", () => {
    const steps = DEFAULT_STEPS.map(step =>
      step.id === "create-account" ? { ...step, done: true } : step,
    );
    const props = buildProps({ onboarding: { steps, setStepDone: jest.fn() } });
    const { result } = renderHook(() => usePayCardViewModel(props));

    result.current.setAllSteps(true);
    expect(props.onboarding.setStepDone).toHaveBeenCalledTimes(3);
    expect(props.onboarding.setStepDone).not.toHaveBeenCalledWith("create-account", true);
  });

  it("setAllSteps(false) clears the steps that were done", () => {
    const steps = DEFAULT_STEPS.map(step => ({ ...step, done: true }));
    const props = buildProps({ onboarding: { steps, setStepDone: jest.fn() } });
    const { result } = renderHook(() => usePayCardViewModel(props));

    result.current.setAllSteps(false);
    expect(props.onboarding.setStepDone).toHaveBeenCalledTimes(4);
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("create-account", false);
  });
});
