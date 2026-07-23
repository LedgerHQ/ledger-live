import BigNumber from "bignumber.js";
import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import type { State } from "~/reducers/types";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import subDays from "date-fns/subDays";
import { useAutoFinishPostOnboarding } from "../useAutoFinishPostOnboarding";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
jest.mock("~/logic/postOnboarding/usePostOnboardingHubStepperDisplay");

const mockedHubState = jest.mocked(usePostOnboardingHubState);
const mockedStepper = jest.mocked(usePostOnboardingHubStepperDisplay);

const daysAgoISO = (days: number) => subDays(new Date(), days).toISOString();

const accountWithFunds = { balance: new BigNumber(1) } as Account;

type Scenario = {
  postOnboardingInProgress: boolean;
  actionsCount: number;
  areAllActionsCompleted: boolean;
  onboardingCompletionDate?: string | null;
  hasCompletedOnboarding?: boolean;
  accounts?: Account[];
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
    postOnboarding: {
      ...state.postOnboarding,
      postOnboardingInProgress: scenario.postOnboardingInProgress,
    },
    settings: {
      ...state.settings,
      hasCompletedOnboarding: scenario.hasCompletedOnboarding ?? true,
      onboardingCompletionDate: scenario.onboardingCompletionDate ?? null,
    },
    accounts: {
      ...state.accounts,
      active: scenario.accounts ?? state.accounts.active,
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
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("clears postOnboardingInProgress when the user has funded accounts", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
      accounts: [accountWithFunds],
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });

  it("clears postOnboardingInProgress when the 15-day cutoff has elapsed", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
      onboardingCompletionDate: daysAgoISO(16),
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });

  it("does not clear postOnboardingInProgress on the last day of the 15-day window", () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
      onboardingCompletionDate: daysAgoISO(15),
    });

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
  });

  it("does not treat incomplete onboarding without a completion date as cutoff elapsed", () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
      onboardingCompletionDate: null,
      hasCompletedOnboarding: false,
    });

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
  });

  it("clears postOnboardingInProgress when all hub actions are completed", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
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
      actionsCount: 2,
      areAllActionsCompleted: false,
      accounts: [],
    });

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
  });

  it("does nothing when post-onboarding is already finished", () => {
    const { store } = setup({
      postOnboardingInProgress: false,
      actionsCount: 2,
      areAllActionsCompleted: false,
    });

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
  });

  it("behaves the same regardless of the onboardingWidget feature flag", async () => {
    const { store } = setup({
      postOnboardingInProgress: true,
      actionsCount: 2,
      areAllActionsCompleted: false,
      accounts: [accountWithFunds],
      transform: withFlagOverrides({ onboardingWidget: { enabled: true } }),
    });

    await waitFor(() =>
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false),
    );
  });
});
