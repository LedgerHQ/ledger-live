import { renderHook, act, withFlagOverrides } from "@tests/test-renderer";
import { useFirstStepSyncOnboardingViewModel } from "./useFirstStepSyncOnboardingViewModel";
import {
  FirstStepCompanionStepKey,
  SEED_STATE,
} from "~/screens/SyncOnboarding/TwoStepStepper/types";
import type { UseFirstStepSyncOnboardingViewModelProps } from "./types";
import type { OnboardingState } from "@ledgerhq/live-common/hw/extractOnboardingState";
import type { State } from "~/reducers/types";
import * as analytics from "~/analytics";

jest.useFakeTimers();

jest.mock("react-native-reanimated", () => {
  const Actual = jest.requireActual("react-native-reanimated/mock");
  return {
    ...Actual,
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (toValue: unknown) => toValue,
  };
});

const mockUseIsFocused = jest.fn();
jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useIsFocused: () => mockUseIsFocused(),
}));

let pollingState: {
  onboardingState: OnboardingState | null;
  allowedError: Error | null;
  fatalError: Error | null;
};
jest.mock("@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling", () => ({
  useOnboardingStatePolling: () => pollingState,
}));

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  isAllowedOnboardingStatePollingErrorDmk: () => true,
}));

const dispatchRedux = jest.fn();
const mockUseDispatch = jest.fn(() => dispatchRedux);
jest.mock("~/context/hooks", () => {
  const actual = jest.requireActual<typeof import("~/context/hooks")>("~/context/hooks");
  return {
    ...actual,
    useDispatch: () => mockUseDispatch(),
  };
});

jest.mock("~/actions/settings", () => ({
  setIsReborn: jest.fn((value: boolean) => ({ type: "setIsReborn", payload: value })),
  setLastConnectedDevice: jest.fn((d: unknown) => ({ type: "setLastConnectedDevice", payload: d })),
  setOnboardingHasDevice: jest.fn((value: boolean) => ({
    type: "setOnboardingHasDevice",
    payload: value,
  })),
}));

jest.mock("~/actions/ble", () => ({
  addKnownDevice: jest.fn((payload: unknown) => ({ type: "addKnownDevice", payload })),
}));

const mockT = jest.fn(
  (key: string, params?: Record<string, unknown>) => `${key}:${JSON.stringify(params)}`,
);
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock("~/screens/SyncOnboarding/TwoStepStepper/useFirstStepCompanionState", () => ({
  __esModule: true,
  default: () => undefined,
}));

const mockUseTrackOnboardingFlow = jest.fn();
jest.mock("~/analytics/hooks/useTrackOnboardingFlow", () => ({
  useTrackOnboardingFlow: (args: unknown) => mockUseTrackOnboardingFlow(args),
}));

jest.spyOn(analytics, "screen");

let companion: {
  activeStep: FirstStepCompanionStepKey;
  setStep: jest.Mock;
  hasSyncStep: boolean;
  isLedgerSyncActive: boolean;
  steps: Array<unknown>;
};
jest.mock(
  "LLM/features/Onboarding/screens/SyncOnboardingCompanion/hooks/useCompanionSteps",
  () => ({
    __esModule: true,
    default: () => companion,
  }),
);

const withProtectServicesMobile =
  (
    enabled: boolean,
    params: { protectId?: string } & Record<string, unknown> = {},
  ): ((state: State) => State) =>
    withFlagOverrides({
      protectServicesMobile: enabled ? { enabled: true, params } : { enabled: false, params: {} },
    });

describe("useFirstStepSyncOnboardingViewModel", () => {
  const device = {
    modelId: "Europa",
    wired: false,
    deviceId: "device-1",
    deviceName: "My Ledger",
  } as unknown as UseFirstStepSyncOnboardingViewModelProps["device"];

  const navigation = {
    navigate: jest.fn(),
  } as unknown as UseFirstStepSyncOnboardingViewModelProps["navigation"];

  const analyticsSeedConfiguration = {
    current: SEED_STATE.NEW_SEED,
  } as UseFirstStepSyncOnboardingViewModelProps["analyticsSeedConfiguration"];

  const defaultProps = (): UseFirstStepSyncOnboardingViewModelProps => ({
    device,
    productName: "Ledger",
    navigation,
    handleSeedGenerationDelay: jest.fn(),
    onLostDevice: jest.fn(),
    notifyEarlySecurityCheckShouldReset: jest.fn(),
    handlePollingError: jest.fn(() => () => undefined),
    isPollingOn: true,
    setIsPollingOn: jest.fn(),
    handleFinishStep: jest.fn(),
    parentRef: null,
    analyticsSeedConfiguration,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    pollingState = { onboardingState: null, allowedError: null, fatalError: null };
    companion = {
      activeStep: FirstStepCompanionStepKey.Ready,
      setStep: jest.fn(),
      hasSyncStep: false,
      isLedgerSyncActive: false,
      steps: [],
    };
    mockUseIsFocused.mockReturnValue(false);
  });

  it("should expose a default seedPathStatus and call onboarding-flow tracking", () => {
    const props = defaultProps();
    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      overrideInitialState: withProtectServicesMobile(false),
    });

    expect(result.current.seedPathStatus).toBe("choice_new_or_restore");
    expect(mockUseTrackOnboardingFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.any(String),
        device,
        seedPathStatus: "choice_new_or_restore",
      }),
    );
  });

  it("should format estimated time using translation key", () => {
    const props = defaultProps();
    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      overrideInitialState: withProtectServicesMobile(false),
    });

    const out = result.current.formatEstimatedTime(120);
    expect(mockT).toHaveBeenCalledWith("syncOnboarding.estimatedTimeFormat", { estimatedTime: 2 });
    expect(out).toContain("syncOnboarding.estimatedTimeFormat");
  });

  it("should stop polling and call onLostDevice when fatal polling error occurs", () => {
    const props = defaultProps();
    pollingState = { onboardingState: null, allowedError: null, fatalError: new Error("boom") };

    renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      overrideInitialState: withProtectServicesMobile(false),
    });

    expect(props.setIsPollingOn).toHaveBeenCalledWith(false);
    expect(props.onLostDevice).toHaveBeenCalled();
  });

  it("should navigate to Recover when seedPathStatus becomes recover_seed and protect services enabled", () => {
    const props = defaultProps();

    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      overrideInitialState: withProtectServicesMobile(true, { protectId: "protect" }),
    });

    act(() => {
      result.current.setSeedPathStatus("recover_seed");
    });

    expect(navigation.navigate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        screen: expect.anything(),
        params: expect.objectContaining({
          fromOnboarding: true,
          device,
          platform: "protect",
          redirectTo: "restore",
          date: expect.any(String),
        }),
      }),
    );
  });

  it("should stop polling and add device to known devices when step passes Ready", () => {
    const props = defaultProps();
    companion.activeStep = FirstStepCompanionStepKey.Ready + 1;

    renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      overrideInitialState: (state: State) => {
        const next = withProtectServicesMobile(false)(state);
        return {
          ...next,
          settings: { ...next.settings, hasCompletedOnboarding: false },
        };
      },
    });

    const { setIsReborn, setLastConnectedDevice, setOnboardingHasDevice } =
      jest.requireMock("~/actions/settings");
    const { addKnownDevice } = jest.requireMock("~/actions/ble");

    expect(props.setIsPollingOn).toHaveBeenCalledWith(false);
    expect(setIsReborn).toHaveBeenCalledWith(false);
    expect(setOnboardingHasDevice).toHaveBeenCalledWith(true);
    expect(setLastConnectedDevice).toHaveBeenCalledWith(device);
    expect(addKnownDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "device-1",
        name: "My Ledger",
        modelId: "Europa",
      }),
    );
  });

  it("handleNextStep should call handleFinishStep and move to Exit after timeout", () => {
    const props = defaultProps();
    companion.activeStep = FirstStepCompanionStepKey.Ready;

    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      overrideInitialState: withProtectServicesMobile(false),
    });

    act(() => {
      result.current.handleNextStep();
    });

    expect(props.handleFinishStep).toHaveBeenCalledWith(SEED_STATE.NEW_SEED);

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(companion.setStep).toHaveBeenCalledWith(FirstStepCompanionStepKey.Exit);
    expect(result.current.hasFinishedExitAnimation).toBe(true);
  });
});
