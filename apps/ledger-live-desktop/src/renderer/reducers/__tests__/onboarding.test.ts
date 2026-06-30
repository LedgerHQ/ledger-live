import onboardingReducer, {
  setShouldResumeAddAccountAfterOnboarding,
  shouldResumeAddAccountAfterOnboardingSelector,
  type OnboardingState,
} from "../onboarding";
import type { State } from "..";

describe("onboarding reducer - shouldResumeAddAccountAfterOnboarding", () => {
  const getInitialState = (): OnboardingState => onboardingReducer(undefined, { type: "@@INIT" });

  it("defaults to false", () => {
    expect(getInitialState().shouldResumeAddAccountAfterOnboarding).toBe(false);
  });

  it("sets the flag to true", () => {
    const state = onboardingReducer(
      getInitialState(),
      setShouldResumeAddAccountAfterOnboarding(true),
    );
    expect(state.shouldResumeAddAccountAfterOnboarding).toBe(true);
  });

  it("clears the flag back to false", () => {
    const enabled = onboardingReducer(
      getInitialState(),
      setShouldResumeAddAccountAfterOnboarding(true),
    );
    const cleared = onboardingReducer(enabled, setShouldResumeAddAccountAfterOnboarding(false));
    expect(cleared.shouldResumeAddAccountAfterOnboarding).toBe(false);
  });

  it("selector reads the flag from state", () => {
    const state = { onboarding: { shouldResumeAddAccountAfterOnboarding: true } } as State;
    expect(shouldResumeAddAccountAfterOnboardingSelector(state)).toBe(true);
  });
});
