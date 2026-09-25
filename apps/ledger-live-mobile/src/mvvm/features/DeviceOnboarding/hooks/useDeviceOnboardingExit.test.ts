import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceOnboardingOutput } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { StackActions } from "@react-navigation/native";
import { renderHook, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { useDeviceOnboardingExit } from "./useDeviceOnboardingExit";
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
const mockRootNavigation = {
  reset: mockReset,
  getParent: () => undefined,
};
const mockNavigation = {
  dispatch: mockNavigationDispatch,
  getParent: () => mockRootNavigation,
};
let mockHasCompletedOnboarding = false;
let mockShouldDisplayMyWallet = false;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation,
}));

jest.mock("~/context/hooks", () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => mockHasCompletedOnboarding,
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

describe("useDeviceOnboardingExit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasCompletedOnboarding = false;
    mockShouldDisplayMyWallet = false;
    mockNavigation.getParent = () => mockRootNavigation;
  });

  it("completes onboarding and opens the completion screen", async () => {
    renderExit("completed");

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
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

  it("opens Wallet Sync with the connected device", async () => {
    renderExit("offerLedgerSync");

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
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

  it("opens My Ledger to resume an interrupted firmware update", async () => {
    renderExit("resumeFirmwareUpdate");

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
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

  it("opens the manager straight into the update for a wired device", async () => {
    renderExit("resumeFirmwareUpdate", { ...device, wired: true });

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
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

  it("opens My Wallet when it replaces My Ledger", async () => {
    mockShouldDisplayMyWallet = true;
    renderExit("resumeFirmwareUpdate");

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
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

  it("opens the legacy onboarding without carrying machine context", async () => {
    renderExit("legacyFallback");

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
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

  it("returns to device selection when onboarding is not completed", async () => {
    renderExit("userQuit");

    await waitFor(() => expect(mockReset).toHaveBeenCalled());
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          expect.objectContaining({
            state: expect.objectContaining({
              routes: [
                expect.objectContaining({
                  state: {
                    routes: [
                      { name: ScreenName.OnboardingWelcome },
                      { name: ScreenName.OnboardingPostWelcomeSelection },
                      { name: ScreenName.OnboardingDeviceSelection },
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

  it("leaves the flow without resetting onboarding for an existing user", async () => {
    mockHasCompletedOnboarding = true;
    renderExit("userQuit");

    await waitFor(() => expect(mockNavigationDispatch).toHaveBeenCalled());
    expect(mockNavigationDispatch).toHaveBeenCalledWith(StackActions.popToTop());
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("resets the outermost navigator", async () => {
    const outerReset = jest.fn();
    const middleReset = jest.fn();
    mockNavigation.getParent = () => ({
      reset: middleReset,
      getParent: () => ({ reset: outerReset, getParent: () => undefined }),
    });

    renderExit("legacyFallback");

    await waitFor(() => expect(outerReset).toHaveBeenCalled());
    expect(middleReset).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("navigates once when the same exit is rendered again with another device", async () => {
    const output = {
      reason: "completed",
      sessionId: "session-id",
      device: { id: "device-id", modelId: DMKDeviceModelId.STAX },
    } as DeviceOnboardingOutput;
    const { rerender } = renderHook(
      (props: { device: Device }) => useDeviceOnboardingExit({ device: props.device, output }),
      { initialProps: { device } },
    );

    await waitFor(() => expect(mockReset).toHaveBeenCalledTimes(1));
    rerender({ device: { ...device, deviceName: "Ledger Flex" } });
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

function renderExit(reason: DeviceOnboardingOutput["reason"], connectedDevice: Device = device) {
  const output = {
    reason,
    sessionId: "session-id",
    device: {
      id: "device-id",
      modelId: DMKDeviceModelId.STAX,
    },
  } as DeviceOnboardingOutput;

  return renderHook(
    (props: { device: Device; output: DeviceOnboardingOutput }) =>
      useDeviceOnboardingExit({ device: props.device, output: props.output }),
    { initialProps: { device: connectedDevice, output } },
  );
}
