import { renderHook } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE, INITIAL_STATE } from "~/renderer/reducers/settings";
import { shouldResumeAddAccountAfterOnboardingSelector } from "~/renderer/reducers/onboarding";
import { useResumeAddAccountAfterOnboarding } from "../useResumeAddAccountAfterOnboarding";

const mockOpenAssetFlow = jest.fn();
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({ openAssetFlow: mockOpenAssetFlow, openAddAccountFlow: jest.fn() }),
}));

// Onboarding slice with a pending "resume Add Account" intent (set when the user was sent to
// device onboarding from the Add Account flow).
const resumeOnboardingState = {
  onboardingSyncFlow: null,
  isOnboardingReceiveFlow: false,
  isOnboardingReceiveSuccess: false,
  isSkipDrawerOpen: false,
  shouldResumeAddAccountAfterOnboarding: true,
};

describe("useResumeAddAccountAfterOnboarding", () => {
  beforeEach(() => {
    mockOpenAssetFlow.mockClear();
  });

  it("resumes the Add Account flow once a device is onboarded and clears the intent", () => {
    const { store } = renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialState: {
        settings: AFTER_ONBOARDING_STATE,
        onboarding: resumeOnboardingState,
      },
    });

    expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
    expect(shouldResumeAddAccountAfterOnboardingSelector(store.getState())).toBe(false);
  });

  it("keeps the resume intent and does not open Add Account while no device is onboarded", () => {
    const { store } = renderHook(() => useResumeAddAccountAfterOnboarding(), {
      initialState: {
        settings: INITIAL_STATE,
        onboarding: resumeOnboardingState,
      },
    });

    expect(mockOpenAssetFlow).not.toHaveBeenCalled();
    expect(shouldResumeAddAccountAfterOnboardingSelector(store.getState())).toBe(true);
  });
});
