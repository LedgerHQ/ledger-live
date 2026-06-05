import { renderHook, act } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { COMPANION_STATE, SEED_STATE } from "../../types";
import { useTwoStepSyncOnboardingCompanionViewModel } from "./useTwoStepSyncOnboardingCompanionViewModel";
import type { UseTwoStepSyncOnboardingCompanionViewModelProps } from "./types";

jest.useFakeTimers();

const dispatchRedux = jest.fn();
jest.mock("~/context/hooks", () => {
  const actual = jest.requireActual<typeof import("~/context/hooks")>("~/context/hooks");
  return {
    ...actual,
    useDispatch: () => dispatchRedux,
  };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ reset: jest.fn() }),
  useIsFocused: () => false,
}));

jest.mock("~/hooks/useKeepScreenAwake", () => ({
  useKeepScreenAwake: jest.fn(),
}));

jest.mock("@ledgerhq/devices", () => ({
  ...jest.requireActual("@ledgerhq/devices"),
  getDeviceModel: () => ({ productName: "Ledger Device" }),
}));

const mockHandleOpenReceiveDrawer = jest.fn();
jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: () => ({ handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer }),
}));

jest.mock("~/screens/SyncOnboarding/TwoStepStepper/useTwoStepDesync", () => ({
  __esModule: true,
  default: () => ({
    isDesyncOverlayOpen: false,
    desyncOverlayDisplayDelayMs: 0,
    handleSeedGenerationDelay: jest.fn(),
    handlePollingError: jest.fn(),
  }),
}));

jest.mock("~/actions/settings", () => ({
  completeOnboarding: jest.fn(() => ({ type: "completeOnboarding" })),
  setHasOrderedNano: jest.fn((value: boolean) => ({ type: "setHasOrderedNano", payload: value })),
  setIsOnboardingFlow: jest.fn((value: boolean) => ({
    type: "setIsOnboardingFlow",
    payload: value,
  })),
  setIsOnboardingFlowReceiveSuccess: jest.fn((value: boolean) => ({
    type: "setIsOnboardingFlowReceiveSuccess",
    payload: value,
  })),
  setReadOnlyMode: jest.fn((value: boolean) => ({ type: "setReadOnlyMode", payload: value })),
}));

describe("useTwoStepSyncOnboardingCompanionViewModel", () => {
  const navigate = jest.fn();
  const navigation = {
    navigate,
    addListener: jest.fn(),
  } as unknown as UseTwoStepSyncOnboardingCompanionViewModelProps["navigation"];

  const device = {
    modelId: "europa",
    deviceId: "device-1",
    deviceName: "My Ledger",
    wired: false,
  } as unknown as UseTwoStepSyncOnboardingCompanionViewModelProps["device"];

  const defaultProps = (): UseTwoStepSyncOnboardingCompanionViewModelProps => ({
    navigation,
    device,
    onLostDevice: jest.fn(),
    onShouldHeaderBeOverlaid: jest.fn(),
    updateHeaderOverlayDelay: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(defaultProps()));

    expect(result.current.companionStep).toBe(COMPANION_STATE.SETUP);
    expect(result.current.isPollingOn).toBe(true);
    expect(result.current.productName).toBe("Ledger Device");
  });

  it("should complete onboarding and navigate to completion when second step finishes with done=false", () => {
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(defaultProps()));

    act(() => {
      result.current.handleSecondStepFinish(false);
    });

    expect(dispatchRedux).toHaveBeenCalledWith({ type: "setReadOnlyMode", payload: false });
    expect(dispatchRedux).toHaveBeenCalledWith({ type: "setHasOrderedNano", payload: false });
    expect(dispatchRedux).toHaveBeenCalledWith({ type: "completeOnboarding" });
    expect(navigate).toHaveBeenCalledWith(
      ScreenName.SyncOnboardingCompletion,
      expect.objectContaining({ device }),
    );
  });

  it("should open the receive drawer when second step finishes with done=true on a new seed", () => {
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(defaultProps()));

    act(() => {
      result.current.setCompanionStep(SEED_STATE.NEW_SEED);
    });

    act(() => {
      result.current.handleSecondStepFinish(true);
    });

    expect(dispatchRedux).toHaveBeenCalledWith({ type: "setIsOnboardingFlow", payload: true });
    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should move to EXIT and complete onboarding after the redirect delay for an existing seed", () => {
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(defaultProps()));

    act(() => {
      result.current.setCompanionStep(SEED_STATE.RESTORE);
    });

    act(() => {
      result.current.handleSecondStepFinish(true);
    });

    expect(result.current.companionStep).toBe(COMPANION_STATE.EXIT);
    expect(navigate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(navigate).toHaveBeenCalledWith(
      ScreenName.SyncOnboardingCompletion,
      expect.objectContaining({ device }),
    );
  });
});
