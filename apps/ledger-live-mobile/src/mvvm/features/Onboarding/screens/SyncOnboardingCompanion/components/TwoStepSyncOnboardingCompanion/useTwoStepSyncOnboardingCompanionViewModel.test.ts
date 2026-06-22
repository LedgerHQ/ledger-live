import { act, renderHook } from "@tests/test-renderer";
import { useTwoStepSyncOnboardingCompanionViewModel } from "./useTwoStepSyncOnboardingCompanionViewModel";
import { COMPANION_STATE, SEED_STATE } from "../../types";
import { ScreenName } from "~/const";
import {
  completeOnboarding,
  setHasOrderedNano,
  setIsOnboardingFlow,
  setIsOnboardingFlowReceiveSuccess,
  setReadOnlyMode,
} from "~/actions/settings";
import type { State } from "~/reducers/types";
import type { TwoStepSyncOnboardingCompanionProps } from "./types";
import { DeviceModelId } from "@ledgerhq/devices";

jest.useFakeTimers();

jest.mock("@ledgerhq/devices", () => ({
  ...jest.requireActual("@ledgerhq/devices"),
  getDeviceModel: jest.fn(() => ({ productName: "Ledger Stax" })),
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ reset: mockReset }),
  useIsFocused: () => true,
}));

jest.mock("~/hooks/useKeepScreenAwake", () => ({
  useKeepScreenAwake: jest.fn(),
}));

const mockHandleOpenReceiveDrawer = jest.fn();
jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: () => ({ handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer }),
}));

const dispatchRedux = jest.fn();
jest.mock("~/context/hooks", () => {
  const actual = jest.requireActual<typeof import("~/context/hooks")>("~/context/hooks");
  return {
    ...actual,
    useDispatch: () => dispatchRedux,
  };
});

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

const withReceiveSuccess =
  (enabled: boolean): ((state: State) => State) =>
  state => ({
    ...state,
    settings: {
      ...state.settings,
      isOnboardingFlowReceiveSuccess: enabled,
    },
  });

describe("useTwoStepSyncOnboardingCompanionViewModel", () => {
  const device = {
    modelId: DeviceModelId.stax,
    deviceId: "device-1",
    wired: false,
  } as unknown as TwoStepSyncOnboardingCompanionProps["device"];
  const navigation = {
    navigate: mockNavigate,
    addListener: mockAddListener,
  } as unknown as TwoStepSyncOnboardingCompanionProps["navigation"];

  const defaultProps = (): TwoStepSyncOnboardingCompanionProps => ({
    device,
    navigation,
    onLostDevice: jest.fn(),
    onShouldHeaderBeOverlaid: jest.fn(),
    updateHeaderOverlayDelay: jest.fn(),
    notifyEarlySecurityCheckShouldReset: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to completion when second step finishes without done flag", () => {
    const props = defaultProps();
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(props));

    act(() => {
      result.current.handleSecondStepFinish(false);
    });

    expect(dispatchRedux).toHaveBeenCalledWith(setReadOnlyMode(false));
    expect(dispatchRedux).toHaveBeenCalledWith(setHasOrderedNano(false));
    expect(dispatchRedux).toHaveBeenCalledWith(completeOnboarding());
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SyncOnboardingCompletion, {
      device,
      seedConfiguration: undefined,
    });
  });

  it("should open receive drawer when second step finishes for new seed flow", () => {
    const props = defaultProps();
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(props));

    act(() => {
      result.current.handleFinishFirstStep(SEED_STATE.NEW_SEED);
    });

    act(() => {
      result.current.handleSecondStepFinish(true);
    });

    expect(dispatchRedux).toHaveBeenCalledWith(setIsOnboardingFlow(true));
    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
  });

  it("should set exit companion step and complete onboarding after redirect delay", () => {
    const props = defaultProps();
    const { result } = renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(props));

    act(() => {
      result.current.handleFinishFirstStep(SEED_STATE.RESTORE);
    });

    act(() => {
      result.current.handleSecondStepFinish(true);
    });

    expect(result.current.companionStep).toBe(COMPANION_STATE.EXIT);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SyncOnboardingCompletion, {
      device,
      seedConfiguration: undefined,
    });
  });

  it("should clear stale receive success flag on mount", () => {
    const props = defaultProps();

    renderHook(() => useTwoStepSyncOnboardingCompanionViewModel(props), {
      overrideInitialState: withReceiveSuccess(true),
    });

    expect(dispatchRedux).toHaveBeenCalledWith(setIsOnboardingFlowReceiveSuccess(false));
  });
});
