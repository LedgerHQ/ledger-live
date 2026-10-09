import type { DeviceOnboardingExitReason } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { useLeaveOnboarding } from "./useLeaveOnboarding";
import {
  completeOnboarding,
  setFromLedgerSyncOnboarding,
  setHasOrderedNano,
  setOnboardingType,
  setReadOnlyMode,
} from "~/actions/settings";
import { OnboardingType } from "~/reducers/types";

const mockDispatch = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockReset = jest.fn();
type ParentNavigation = {
  reset: jest.Mock;
  getParent: () => ParentNavigation | undefined;
};

const mockRootNavigation: ParentNavigation = {
  reset: mockReset,
  getParent: () => undefined,
};
const mockNavigation: {
  dispatch: jest.Mock;
  getParent: () => ParentNavigation;
} = {
  dispatch: mockNavigationDispatch,
  getParent: () => mockRootNavigation,
};
let mockShouldDisplayMyWallet = false;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation,
}));

jest.mock("~/context/hooks", () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => false,
}));

jest.mock("@features/platform-feature-flags", () => ({
  useWalletFeaturesConfig: () => ({
    shouldDisplayMyWallet: mockShouldDisplayMyWallet,
  }),
}));

const device: Device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

describe("useLeaveOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldDisplayMyWallet = false;
    mockNavigation.getParent = () => mockRootNavigation;
  });

  it("completes onboarding and opens the completion screen", () => {
    renderExit("completed");

    expect(mockDispatch).toHaveBeenCalledWith(setReadOnlyMode(false));
    expect(mockDispatch).toHaveBeenCalledWith(setHasOrderedNano(false));
    expect(mockDispatch).toHaveBeenCalledWith(completeOnboarding());
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            name: NavigatorName.BaseOnboarding,
            state: expect.objectContaining({
              routes: [
                expect.objectContaining({
                  name: NavigatorName.SyncOnboarding,
                  state: expect.objectContaining({
                    routes: [
                      expect.objectContaining({
                        name: ScreenName.SyncOnboardingCompletion,
                        params: { device },
                      }),
                    ],
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
    );
  });

  it("opens Wallet Sync with the connected device", () => {
    renderExit("offerLedgerSync");

    expect(mockDispatch).toHaveBeenCalledWith(setFromLedgerSyncOnboarding(true));
    expect(mockDispatch).toHaveBeenCalledWith(setOnboardingType(OnboardingType.setupNew));
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            state: expect.objectContaining({
              routes: [
                expect.objectContaining({
                  name: NavigatorName.WalletSync,
                  state: expect.objectContaining({
                    routes: [
                      {
                        name: ScreenName.WalletSyncActivationProcess,
                        params: { device },
                      },
                    ],
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
    );
  });

  it("opens My Ledger to resume an interrupted firmware update", () => {
    renderExit("resumeFirmwareUpdate");

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            name: NavigatorName.Base,
            state: expect.objectContaining({
              routes: [
                { name: NavigatorName.Main },
                expect.objectContaining({
                  name: NavigatorName.MyLedger,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyLedgerChooseDevice,
                        params: { device, firmwareUpdate: false },
                      },
                    ],
                  },
                }),
              ],
            }),
          }),
        ],
      }),
    );
  });

  it("opens the manager straight into the update for a wired device", () => {
    renderExit("resumeFirmwareUpdate", { ...device, wired: true });

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            state: expect.objectContaining({
              routes: [
                { name: NavigatorName.Main },
                expect.objectContaining({
                  state: {
                    routes: [
                      expect.objectContaining({
                        params: { device: { ...device, wired: true }, firmwareUpdate: true },
                      }),
                    ],
                  },
                }),
              ],
            }),
          }),
        ],
      }),
    );
  });

  it("opens My Wallet when it replaces My Ledger", () => {
    mockShouldDisplayMyWallet = true;
    renderExit("resumeFirmwareUpdate");

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            state: expect.objectContaining({
              routes: [
                { name: NavigatorName.Main },
                expect.objectContaining({
                  name: NavigatorName.MyWallet,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyWallet,
                        params: { device, firmwareUpdate: false },
                      },
                    ],
                  },
                }),
              ],
            }),
          }),
        ],
      }),
    );
  });

  it("opens the legacy onboarding without carrying machine context", () => {
    renderExit("legacyFallback");

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            state: expect.objectContaining({
              routes: [
                expect.objectContaining({
                  name: NavigatorName.Onboarding,
                  state: {
                    routes: [
                      {
                        name: ScreenName.OnboardingUseCase,
                        params: { deviceModelId: DeviceModelId.stax },
                      },
                    ],
                  },
                }),
              ],
            }),
          }),
        ],
      }),
    );
  });

  it("stays on the screen when open next screen is off", () => {
    const { result } = renderHook(() => useLeaveOnboarding({ device, showNextScreen: false }));

    result.current("completed");

    expect(mockReset).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("stays on the screen when the user quits", () => {
    renderExit("userQuit");

    expect(mockReset).not.toHaveBeenCalled();
    expect(mockNavigationDispatch).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("resets the outermost navigator", () => {
    const outerReset = jest.fn();
    const middleReset = jest.fn();
    mockNavigation.getParent = () => ({
      reset: middleReset,
      getParent: () => ({ reset: outerReset, getParent: () => undefined }),
    });

    renderExit("legacyFallback");

    expect(outerReset).toHaveBeenCalled();
    expect(middleReset).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });
});

function renderExit(reason: DeviceOnboardingExitReason, connectedDevice: Device = device) {
  const { result } = renderHook(() =>
    useLeaveOnboarding({ device: connectedDevice, showNextScreen: true }),
  );
  result.current(reason);
}
