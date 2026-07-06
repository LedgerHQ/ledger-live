import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  usePostOnboardingHubState,
  usePostOnboardingPortfolioWidgetVisibility,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import type { State } from "~/reducers/types";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import { useAutoFinishPostOnboarding } from "../useAutoFinishPostOnboarding";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
jest.mock("~/logic/postOnboarding/usePostOnboardingHubStepperDisplay");

const mockedHubState = jest.mocked(usePostOnboardingHubState);
const mockedWidgetVisibility = jest.mocked(usePostOnboardingPortfolioWidgetVisibility);
const mockedStepper = jest.mocked(usePostOnboardingHubStepperDisplay);

const daysAgoISO = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

type Scenario = {
  postOnboardingInProgress: boolean;
  isPortfolioWidgetBaseVisible: boolean;
  actionsCount: number;
  areAllActionsCompleted: boolean;
  onboardingCompletionDate?: string | null;
  hasCompletedOnboarding?: boolean;
  transform?: (state: State) => State;
};

const makeAction = () =>
  ({
    id: "mock",
    completed: false,
    Icon: () => null,
    title: "",
    titleCompleted: "",
  }) as never;

function setup(scenario: Scenario) {
  mockedHubState.mockReturnValue({
    deviceModelId: DeviceModelId.stax,
    actionsState: Array.from({ length: scenario.actionsCount }, makeAction),
    lastActionCompleted: null,
    postOnboardingInProgress: scenario.postOnboardingInProgress,
  });
  mockedWidgetVisibility.mockReturnValue({
    isPortfolioWidgetBaseVisible: scenario.isPortfolioWidgetBaseVisible,
  });
  mockedStepper.mockReturnValue({
    currentStep: 1,
    totalSteps: 1,
    stepperLabel: "",
    loading: false,
    areAllActionsCompleted: scenario.areAllActionsCompleted,
    actionCompletionById: {},
  });

  const baseTransform = (state: State): State => ({
    ...state,
    postOnboarding: { ...state.postOnboarding, postOnboardingInProgress: true },
    settings: {
      ...state.settings,
      hasCompletedOnboarding: scenario.hasCompletedOnboarding ?? true,
      onboardingCompletionDate: scenario.onboardingCompletionDate ?? null,
    },
  });

  return renderHook(() => useAutoFinishPostOnboarding(), {
    overrideInitialState: scenario.transform
      ? state => scenario.transform!(baseTransform(state))
      : baseTransform,
  });
}

describe("useAutoFinishPostOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears postOnboardingInProgress when the user is no longer eligible (has funds)", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      isPortfolioWidgetBaseVisible: false,
      actionsCount: 2,
      areAllActionsCompleted: false,
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });

  it("clears postOnboardingInProgress when the 15-day cutoff has elapsed", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      isPortfolioWidgetBaseVisible: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
      onboardingCompletionDate: daysAgoISO(20),
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });

  it("clears postOnboardingInProgress when all hub actions are completed", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      isPortfolioWidgetBaseVisible: true,
      actionsCount: 2,
      areAllActionsCompleted: true,
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });

  it("keeps postOnboardingInProgress while genuinely in the post-onboarding phase", () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      isPortfolioWidgetBaseVisible: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
    });

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
  });

  it("does nothing when post-onboarding is already finished", () => {
    const { store } = setup({
      postOnboardingInProgress: false,
      isPortfolioWidgetBaseVisible: false,
      actionsCount: 2,
      areAllActionsCompleted: false,
    });

    // The guard requires the flag to be in progress; the store is left untouched.
    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
  });

  it("behaves the same regardless of the onboardingWidget feature flag", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      isPortfolioWidgetBaseVisible: false,
      actionsCount: 2,
      areAllActionsCompleted: false,
      transform: withFlagOverrides({ onboardingWidget: { enabled: true } }),
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });
});
