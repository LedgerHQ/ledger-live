import { renderHook } from "@support/jest-devtools/native";
import { usePayCardViewModel } from "./usePayCardViewModel";
import type { OnboardingStep, PayCardToolProps } from "./types";

// Mobile step set: same as desktop plus the mobile-only `walletPay`
// (Apple/Google Pay) step, injected here by the native binding.
const DEFAULT_STEPS: OnboardingStep[] = [
  { id: "kyc", label: "Kyc", done: false },
  { id: "claim", label: "Claim card", done: false },
  { id: "topup", label: "Top up", done: false },
  { id: "walletPay", label: "Apple/Google Pay", done: false },
  { id: "purchase", label: "First Purchase", done: false },
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
    interaction: {
      probes: [],
      details: {
        imageUrl: undefined,
        isFetching: false,
        error: undefined,
        request: jest.fn(),
        clear: jest.fn(),
      },
      ...overrides.interaction,
    },
    balance: {
      baanxWallets: [],
      linkedWallets: [],
      combinedWallets: [],
      isFetching: false,
      errors: [],
      load: jest.fn(),
      refresh: jest.fn(),
      ...overrides.balance,
    },
    hasSeenFeatureTour: overrides.hasSeenFeatureTour ?? false,
    resetPayCardFeatureTourSeen: overrides.resetPayCardFeatureTourSeen ?? jest.fn(),
    hasSeenReceiveVerifyHint: overrides.hasSeenReceiveVerifyHint ?? false,
    resetReceiveVerifyHintSeen: overrides.resetReceiveVerifyHintSeen ?? jest.fn(),
    env: overrides.env ?? { vars: [], setVar: jest.fn() },
  };
}

describe("usePayCardViewModel (native)", () => {
  it("exposes the mobile step set including the wallet-pay step", () => {
    const { result } = renderHook(() => usePayCardViewModel(buildProps()));
    expect(result.current.totalCount).toBe(5);
    expect(result.current.steps.map(step => step.id)).toContain("walletPay");
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
    result.current.toggleStep("walletPay");
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("walletPay", true);
  });

  it("setAllSteps updates every not-done step", () => {
    const props = buildProps();
    const { result } = renderHook(() => usePayCardViewModel(props));
    result.current.setAllSteps(true);
    expect(props.onboarding.setStepDone).toHaveBeenCalledTimes(5);
  });
});
