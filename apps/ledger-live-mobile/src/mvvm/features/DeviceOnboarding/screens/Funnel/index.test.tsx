import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import type { DeviceOnboardingHost } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useDeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { funnelTestIds } from "LLM/features/DeviceOnboarding/testIds";
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
});
