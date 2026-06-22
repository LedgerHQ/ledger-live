import { act, renderHook } from "@tests/test-renderer";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useLedgerSyncActivationStepViewModel } from "./useLedgerSyncActivationStepViewModel";
import { NavigatorName, ScreenName } from "~/const";
import { setFromLedgerSyncOnboarding, setOnboardingType } from "~/actions/settings";
import { OnboardingType } from "~/reducers/types";
import * as analytics from "~/analytics";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
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
  setFromLedgerSyncOnboarding: jest.fn((value: boolean) => ({
    type: "setFromLedgerSyncOnboarding",
    payload: value,
  })),
  setOnboardingType: jest.fn((value: string) => ({
    type: "setOnboardingType",
    payload: value,
  })),
}));

const mockTrack = jest.fn();
const mockScreen = jest.fn();
jest.spyOn(analytics, "track").mockImplementation(mockTrack);
jest.spyOn(analytics, "screen").mockImplementation(mockScreen);

describe("useLedgerSyncActivationStepViewModel", () => {
  const device = {
    modelId: "Europa",
    deviceId: "device-1",
    wired: false,
  } as unknown as Device;
  const handleContinue = jest.fn();
  const analyticsSeedConfiguration = { current: "new_seed" as const };

  const defaultProps = () => ({
    handleContinue,
    isLedgerSyncActive: false,
    device,
    analyticsSeedConfiguration,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to Wallet Sync activation when continue is pressed", () => {
    const { result } = renderHook(() => useLedgerSyncActivationStepViewModel(defaultProps()));

    act(() => {
      result.current.handleSyncContinue();
    });

    expect(dispatchRedux).toHaveBeenCalledWith(setFromLedgerSyncOnboarding(true));
    expect(dispatchRedux).toHaveBeenCalledWith(setOnboardingType(OnboardingType.setupNew));
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: { device },
    });
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Continue",
      seedConfiguration: "new_seed",
      flow: "onboarding",
    });
  });

  it("should open drawer when skip CTA is pressed", () => {
    const { result } = renderHook(() => useLedgerSyncActivationStepViewModel(defaultProps()));

    act(() => {
      result.current.handleSkipCTA();
    });

    expect(result.current.isDrawerOpen).toBe(true);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Maybe later",
      seedConfiguration: "new_seed",
      flow: "onboarding",
    });
  });

  it("should skip sync and call handleContinue when user confirms skip", () => {
    const { result } = renderHook(() => useLedgerSyncActivationStepViewModel(defaultProps()));

    act(() => {
      result.current.handleSkipCTA();
    });

    act(() => {
      result.current.handleSkip();
    });

    expect(result.current.isDrawerOpen).toBe(false);
    expect(handleContinue).toHaveBeenCalled();
    expect(mockScreen).toHaveBeenCalledWith(
      "Set up device: Step 4 Ledger Sync Reject",
      undefined,
      {
        seedConfiguration: "new_seed",
        flow: "onboarding",
      },
      true,
      true,
    );
  });

  it("should navigate to Wallet Sync when enabling sync from drawer", () => {
    const { result } = renderHook(() => useLedgerSyncActivationStepViewModel(defaultProps()));

    act(() => {
      result.current.handleSyncOpenFromDrawer();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: { device },
    });
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Enable sync",
      seedConfiguration: "new_seed",
      flow: "onboarding",
    });
  });
});
