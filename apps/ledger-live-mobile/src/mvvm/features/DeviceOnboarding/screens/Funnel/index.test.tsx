import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, render, screen } from "@tests/test-renderer";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import type { DeviceOnboardingHost } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useDeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { checksTestIds, funnelTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { DeviceOnboardingFunnel } from "./index";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    goBack: jest.fn(),
    addListener: () => jest.fn(),
  }),
  useRoute: () => ({ params: { wasReadOnlyAtEntry: true } }),
}));

jest.mock("../../hooks/DeviceOnboardingProvider", () => ({
  useDeviceOnboardingSession: jest.fn(),
  useDeviceOnboardingHost: (_host: DeviceOnboardingHost) => undefined,
}));

jest.mock("../../hooks/useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: () => ({ close: jest.fn() }),
}));

jest.mock("~/components/QueuedDrawer", () => {
  const { View } = jest.requireActual("react-native");
  return function QueuedDrawerMock({
    isRequestingToBeOpened,
    children,
  }: {
    isRequestingToBeOpened?: boolean;
    children?: React.ReactNode;
  }) {
    if (!isRequestingToBeOpened) return null;
    return <View>{children}</View>;
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetHeader: () => null,
    BottomSheetView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
  };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: jest.requireActual("@shared/ui-queued-bottom-sheet/testing/module-mock")
    .QueuedBottomSheet,
}));

const useSession = jest.mocked(useDeviceOnboardingSession);

function session(state: string): DeviceOnboardingSession {
  return {
    status: "running",
    device: null,
    liveDevice: {
      deviceId: "device-id",
      deviceName: "Ledger Stax",
      modelId: DeviceModelId.stax,
      wired: false,
    },
    state,
    context: { checksPaused: false } as DeviceOnboardingSession["context"],
    snapshot: null,
    exit: null,
    sendableEvents: [],
    error: null,
    connect: jest.fn(),
    adopt: jest.fn(),
    discard: jest.fn(),
    send: jest.fn(),
    reset: jest.fn(),
    reconnectAfterUpdate: jest.fn(),
    abortFirmwareReconnect: jest.fn(),
    actorRef: { current: null },
    portsRef: { current: null },
  };
}

function renderWaiting() {
  const abortFirmwareReconnect = jest.fn();
  useSession.mockReturnValue({
    ...session("awaitingSessionAfterFirmwareUpdate"),
    context: {
      checksPaused: false,
      onboardedOnEntry: true,
      returningFromFirmwareUpdate: true,
    } as DeviceOnboardingSession["context"],
    abortFirmwareReconnect,
  });
  return { ...render(<DeviceOnboardingFunnel />), abortFirmwareReconnect };
}

describe("DeviceOnboardingFunnel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the unlock sheet over the current screen without a close action", () => {
    useSession.mockReturnValue(session("awaitingStart"));
    const view = render(<DeviceOnboardingFunnel />);

    expect(screen.queryByText("Unlock your Ledger Stax")).toBeNull();
    expect(
      screen.getByText("Let's confirm that your Ledger device is genuine and up-to-date."),
    ).toBeVisible();

    useSession.mockReturnValue(session("deviceLocked"));
    view.rerender(<DeviceOnboardingFunnel />);

    expect(screen.getByText("Unlock your Ledger Stax")).toBeVisible();
    expect(
      screen.getByText("Let's confirm that your Ledger device is genuine and up-to-date."),
    ).toBeVisible();
    expect(screen.queryByTestId(`${funnelTestIds.unlockSheet}-header-close`)).toBeNull();
    expect(screen.queryByTestId(`${funnelTestIds.unlockSheet}-dismiss`)).toBeNull();
    expect(screen.queryByTestId(`${funnelTestIds.unlockSheet}-backdrop`)).toBeNull();
  });

  describe("when the updated device takes long to come back", () => {
    it("should keep the checks up without a sheet at first", () => {
      renderWaiting();
      act(() => jest.advanceTimersByTime(19_999));

      expect(screen.getByTestId(checksTestIds.quit)).toBeVisible();
      expect(screen.queryByTestId(funnelTestIds.powerOnSheet)).toBeNull();
      expect(screen.queryByText("Connection failed")).toBeNull();
    });

    it("should ask to power on after 20 seconds and let the user quit", async () => {
      const { user, abortFirmwareReconnect } = renderWaiting();
      act(() => jest.advanceTimersByTime(20_000));

      expect(screen.getByText("Power on and unlock your Ledger Stax")).toBeVisible();

      await user.press(screen.getByTestId(`${funnelTestIds.powerOnSheet}-header-close`));

      expect(abortFirmwareReconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the device switches off during checks", () => {
    function renderSwitchedOff(initialState: string, context?: DeviceOnboardingSession["context"]) {
      const send = jest.fn();
      useSession.mockReturnValue({
        ...session(initialState),
        ...(context ? { context } : {}),
      });
      const view = render(<DeviceOnboardingFunnel />);

      useSession.mockReturnValue({
        ...session("awaitingSession"),
        ...(context ? { context } : {}),
        send,
      });
      view.rerender(<DeviceOnboardingFunnel />);

      return { ...view, send };
    }

    it("should ask to power on instead of showing the connection failure", () => {
      renderSwitchedOff("checks.genuineCheck.running");

      expect(screen.getByText("Power on and unlock your Ledger Stax")).toBeVisible();
      expect(screen.queryByText("Connection failed")).toBeNull();
      expect(screen.getByTestId(funnelTestIds.powerOnSheet)).toBeVisible();
      expect(screen.queryByTestId(funnelTestIds.unlockSheet)).toBeNull();
    });

    it("should let the user quit from the power on sheet", async () => {
      const { user, send } = renderSwitchedOff("checks.genuineCheck.running");

      await user.press(screen.getByTestId(`${funnelTestIds.powerOnSheet}-header-close`));

      expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    });

    it("should let the user quit from the header while a firmware offer is hidden", async () => {
      const { user, send } = renderSwitchedOff("checks.firmwareUpdateOffered", {
        firmwareVersion: "1.0.0",
        availableFirmwareVersion: "1.1.0",
        checksPaused: false,
      } as DeviceOnboardingSession["context"]);

      await user.press(screen.getByTestId(checksTestIds.quit));

      expect(send).toHaveBeenCalledWith({ type: "QUIT" });
    });
  });
});
