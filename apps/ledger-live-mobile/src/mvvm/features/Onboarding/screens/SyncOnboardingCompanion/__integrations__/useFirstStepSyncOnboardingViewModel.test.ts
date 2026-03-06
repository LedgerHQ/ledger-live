import { renderHook, waitFor } from "@tests/test-renderer";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useIsFocused } from "@react-navigation/core";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import useCompanionSteps from "LLM/features/Onboarding/screens/SyncOnboardingCompanion/hooks/useCompanionSteps";
import useFirstStepCompanionState from "~/screens/SyncOnboarding/TwoStepStepper/useFirstStepCompanionState";
import { useTrackOnboardingFlow } from "~/analytics/hooks/useTrackOnboardingFlow";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { FirstStepCompanionStepKey } from "~/screens/SyncOnboarding/TwoStepStepper/types";
import {
  SEED_STATE,
  useFirstStepSyncOnboardingViewModel,
} from "../components/FirstStepSyncOnboarding/useFirstStepSyncOnboardingViewModel";

jest.mock("@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling");
jest.mock("@ledgerhq/live-common/featureFlags/index");
jest.mock("@react-navigation/core");
jest.mock("~/context/hooks");
jest.mock("~/context/Locale");
jest.mock("LLM/features/Onboarding/screens/SyncOnboardingCompanion/hooks/useCompanionSteps");
jest.mock("~/screens/SyncOnboarding/TwoStepStepper/useFirstStepCompanionState");
jest.mock("~/analytics/hooks/useTrackOnboardingFlow");

const mockDevice = {
  deviceId: "test-device-123",
  deviceName: "Test Device",
  modelId: "nanoS",
};

const createDefaultProps = (overrides = {}) => ({
  device: mockDevice,
  productName: "Nano S",
  navigation: {
    navigate: jest.fn(),
  } as any,
  handleSeedGenerationDelay: jest.fn(),
  onLostDevice: jest.fn(),
  notifyEarlySecurityCheckShouldReset: jest.fn(),
  handlePollingError: jest.fn(() => undefined),
  isPollingOn: true,
  setIsPollingOn: jest.fn(),
  handleFinishStep: jest.fn(),
  parentRef: null,
  analyticsSeedConfiguration: { current: undefined },
  ...overrides,
});

describe("useFirstStepSyncOnboardingViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: jest.fn() });
    (useIsFocused as jest.Mock).mockReturnValue(true);
    (useDispatch as jest.Mock).mockReturnValue(jest.fn());
    (useSelector as jest.Mock).mockReturnValue(false);
    (useFeature as jest.Mock).mockReturnValue({ enabled: false });
    (useOnboardingStatePolling as jest.Mock).mockReturnValue({
      onboardingState: null,
      allowedError: null,
      fatalError: null,
    });
    (useCompanionSteps as jest.Mock).mockReturnValue({
      activeStep: FirstStepCompanionStepKey.Start,
      setStep: jest.fn(),
      hasSyncStep: false,
      isLedgerSyncActive: false,
    });
    (useFirstStepCompanionState as jest.Mock).mockReturnValue(undefined);
    (useTrackOnboardingFlow as jest.Mock).mockReturnValue(undefined);
  });

  it("should initialize with correct default state", () => {
    const props = createDefaultProps();
    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    expect(result.current.seedPathStatus).toBe("choice_new_or_restore");
    expect(result.current.hasFinishedExitAnimation).toBe(false);
    expect(result.current.isFinishedStep).toBe(false);
  });

  it("should call handlePollingError when allowedError changes", () => {
    const handlePollingError = jest.fn(() => undefined);
    const props = createDefaultProps({ handlePollingError });
    const testError = new Error("Test error");

    (useOnboardingStatePolling as jest.Mock).mockReturnValue({
      onboardingState: null,
      allowedError: testError,
      fatalError: null,
    });

    renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    expect(handlePollingError).toHaveBeenCalledWith(testError);
  });

  it("should call onLostDevice and setIsPollingOn when fatalError occurs", async () => {
    const onLostDevice = jest.fn();
    const setIsPollingOn = jest.fn();
    const props = createDefaultProps({ onLostDevice, setIsPollingOn });
    const fatalError = new Error("Fatal error");

    const { rerender } = renderHook(() => useFirstStepSyncOnboardingViewModel(props), {
      initialProps: props,
    });

    (useOnboardingStatePolling as jest.Mock).mockReturnValue({
      onboardingState: null,
      allowedError: null,
      fatalError: null,
    });

    rerender(props);

    (useOnboardingStatePolling as jest.Mock).mockReturnValue({
      onboardingState: null,
      allowedError: null,
      fatalError,
    });

    rerender(props);

    await waitFor(() => {
      expect(onLostDevice).toHaveBeenCalled();
      expect(setIsPollingOn).toHaveBeenCalledWith(false);
    });
  });

  it("should add device to known devices when activeStep is greater than Ready", async () => {
    const dispatchRedux = jest.fn();
    const setIsPollingOn = jest.fn();
    const props = createDefaultProps({ setIsPollingOn });

    (useDispatch as jest.Mock).mockReturnValue(dispatchRedux);
    (useCompanionSteps as jest.Mock).mockReturnValue({
      activeStep: FirstStepCompanionStepKey.Seed,
      setStep: jest.fn(),
      hasSyncStep: false,
      isLedgerSyncActive: false,
    });

    const { rerender } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    (useCompanionSteps as jest.Mock).mockReturnValue({
      activeStep: FirstStepCompanionStepKey.Sync,
      setStep: jest.fn(),
      hasSyncStep: false,
      isLedgerSyncActive: false,
    });

    rerender(props);

    await waitFor(() => {
      expect(setIsPollingOn).toHaveBeenCalledWith(false);
      expect(dispatchRedux).toHaveBeenCalled();
    });
  });

  it("should stop polling when activeStep is greater than Ready", async () => {
    const setIsPollingOn = jest.fn();
    const props = createDefaultProps({ setIsPollingOn });

    (useCompanionSteps as jest.Mock).mockReturnValue({
      activeStep: FirstStepCompanionStepKey.Ready,
      setStep: jest.fn(),
      hasSyncStep: false,
      isLedgerSyncActive: false,
    });

    renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    await waitFor(() => {
      expect(setIsPollingOn).toHaveBeenCalledWith(false);
    });
  });

  it("should call handleSeedGenerationDelay when seed phrase generation is near completion", async () => {
    const handleSeedGenerationDelay = jest.fn();
    const props = createDefaultProps({ handleSeedGenerationDelay });

    (useOnboardingStatePolling as jest.Mock).mockReturnValue({
      onboardingState: {
        seedPhraseType: 24,
        currentOnboardingStep: OnboardingStep.NewDeviceConfirming,
        currentSeedWordIndex: 22,
        isOnboarded: false,
      },
      allowedError: null,
      fatalError: null,
    });

    renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    await waitFor(() => {
      expect(handleSeedGenerationDelay).toHaveBeenCalled();
    });
  });

  it("should initialize deviceInitiallyOnboarded from onboardingState", async () => {
    const props = createDefaultProps();

    (useOnboardingStatePolling as jest.Mock).mockReturnValue({
      onboardingState: {
        isOnboarded: false,
        seedPhraseType: 12,
        currentOnboardingStep: OnboardingStep.NewDeviceConfirming,
        currentSeedWordIndex: 0,
      },
      allowedError: null,
      fatalError: null,
    });

    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    expect(result.current).toBeDefined();
  });

  it("should call handleNextStep and trigger exit animation", async () => {
    const handleFinishStep = jest.fn();
    const setStep = jest.fn();
    const props = createDefaultProps({
      handleFinishStep,
      analyticsSeedConfiguration: { current: SEED_STATE.NEW_SEED },
    });

    (useCompanionSteps as jest.Mock).mockReturnValue({
      activeStep: FirstStepCompanionStepKey.Seed,
      setStep,
      hasSyncStep: false,
      isLedgerSyncActive: false,
    });

    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    result.current.handleNextStep();

    expect(result.current.isFinishedStep).toBe(true);
    expect(handleFinishStep).toHaveBeenCalledWith(SEED_STATE.NEW_SEED);
  });

  it("should return formatEstimatedTime function", () => {
    const props = createDefaultProps();
    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    expect(typeof result.current.formatEstimatedTime).toBe("function");
  });

  it("should return handleLayout function", () => {
    const props = createDefaultProps();
    const { result } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    expect(typeof result.current.handleLayout).toBe("function");
  });

  it("should stop polling on unmount", () => {
    const setIsPollingOn = jest.fn();
    const props = createDefaultProps({ setIsPollingOn });

    const { unmount } = renderHook(() => useFirstStepSyncOnboardingViewModel(props));

    unmount();

    expect(setIsPollingOn).toHaveBeenCalledWith(false);
  });
});
