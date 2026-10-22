import type { HostOnboardingEvent } from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useLayoutEffect } from "react";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { ScreenName, BASE_NAVIGATOR_ID } from "~/const";
import { useFirmwareUpdateHandover } from "./useFirmwareUpdateHandover";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";

const mockPush = jest.fn();
const mockGoBack = jest.fn();
const mockCurrentPush = jest.fn();
let mockFocusCallback: (() => void) | null = null;

type ParentNavigation = {
  push: typeof mockPush;
  goBack: typeof mockGoBack;
};

const mockGetParent = jest.fn((_id?: string): ParentNavigation | undefined => ({
  push: mockPush,
  goBack: mockGoBack,
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    push: mockCurrentPush,
    getParent: (id?: string) => mockGetParent(id),
  }),
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => ({
  useGetLatestAvailableFirmware: jest.fn(),
}));

const mockedUseGetLatestAvailableFirmware = jest.mocked(useGetLatestAvailableFirmware);

const device: Device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const deviceInfo = { version: "1.0.0" };
const firmwareUpdateContext = { final: { name: "2.0.0" } };

describe("useFirmwareUpdateHandover", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = null;
    mockFirmwareState("idle");
  });

  it("opens the mobile firmware update when the machine delegates it", async () => {
    const send = jest.fn();
    const { rerender } = renderDelegated(send);

    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        ScreenName.FirmwareUpdate,
        expect.objectContaining({
          device,
          deviceInfo,
          firmwareUpdateContext,
          isBeforeOnboarding: true,
        }),
      ),
    );
    expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
    expect(send).not.toHaveBeenCalled();
    expect(mockCurrentPush).not.toHaveBeenCalled();
  });

  it("should guard the exit and keep the apps backup when the delegated device is already seeded", async () => {
    const { rerender } = renderDelegated(jest.fn(), { isDeviceOnboarded: true });

    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        ScreenName.FirmwareUpdate,
        expect.objectContaining({
          device,
          isBeforeOnboarding: true,
          isDeviceOnboarded: true,
        }),
      ),
    );
  });

  it("opens the update on the current navigator when Base is not mounted", async () => {
    mockGetParent.mockImplementation(() => undefined);
    const send = jest.fn();
    const { rerender } = renderDelegated(send);

    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });

    await waitFor(() =>
      expect(mockCurrentPush).toHaveBeenCalledWith(
        ScreenName.FirmwareUpdate,
        expect.objectContaining({ device, isBeforeOnboarding: true }),
      ),
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    mockGetParent.mockImplementation(() => ({
      push: mockPush,
      goBack: mockGoBack,
    }));
  });

  it("closes the handover exactly once when callback and focus both report the return", async () => {
    const send = jest.fn();
    const { rerender } = renderDelegated(send);

    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const params = mockPush.mock.calls[0][1] as {
      onBackFromUpdate: () => void;
    };

    act(() => {
      params.onBackFromUpdate();
      mockFocusCallback?.();
      params.onBackFromUpdate();
    });

    expect(mockFocusCallback).not.toBeNull();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
  });

  it("asks for a new session when the update completed, and does not close the old one", async () => {
    const send = jest.fn();
    const onUpdateCompleted = jest.fn();
    const { rerender } = renderDelegated(send, { onUpdateCompleted });

    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const params = mockPush.mock.calls[0][1] as {
      onBackFromUpdate: (updateStep?: string) => void;
    };

    act(() => {
      params.onBackFromUpdate("completed");
      mockFocusCallback?.();
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(onUpdateCompleted).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
  });

  it("closes from focus alone when the screen was popped without the back callback", async () => {
    const send = jest.fn();
    const { rerender } = renderDelegated(send);

    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());

    act(() => {
      mockFocusCallback?.();
    });

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
  });

  it.each(["error", "no-available-firmware"] as const)(
    "returns control without opening the updater when metadata ends with %s",
    async status => {
      const send = jest.fn();
      const { rerender } = renderDelegated(send);

      reportFirmware(status);
      rerender({ machineState: delegated });

      await waitFor(() =>
        expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" }),
      );
      expect(send).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it("ignores the previous metadata result when the machine delegates the update again", async () => {
    const send = jest.fn();
    const { rerender } = renderDelegated(send);

    reportFirmware("error");
    rerender({ machineState: delegated });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));

    rerender({ machineState: "readingState" });
    reportFirmware("error");
    rerender({ machineState: delegated });

    expect(send).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();

    reportFirmware("ongoing");
    rerender({ machineState: delegated });
    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({ machineState: delegated });

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not open the updater when the user closes before its effect runs", () => {
    const send = jest.fn();
    const closeOnLayout = { current: false };
    reportFirmware("ongoing");

    const { rerender } = renderHook(() => {
      const handover = useFirmwareUpdateHandover({
        device,
        isDeviceOnboarded: false,
        machineState: delegated,
        send,
        onUpdateCompleted: jest.fn(),
      });
      useLayoutEffect(() => {
        if (closeOnLayout.current) handover.close();
      });
      return handover;
    });

    expect(mockPush).not.toHaveBeenCalled();

    closeOnLayout.current = true;
    reportFirmware("available-firmware", deviceInfo, firmwareUpdateContext);
    rerender({});

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockCurrentPush).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
  });

  it("does not fetch firmware metadata outside the delegated state", () => {
    renderHook(() =>
      useFirmwareUpdateHandover({
        device,
        isDeviceOnboarded: false,
        machineState: "checks.firmwareUpdateOffered",
        send: jest.fn(),
        onUpdateCompleted: jest.fn(),
      }),
    );

    expect(mockedUseGetLatestAvailableFirmware).toHaveBeenCalledWith(
      expect.objectContaining({ isHookEnabled: false }),
    );
  });
});

const delegated = "checks.firmwareUpdateDelegated";

function renderDelegated(
  send: (event: HostOnboardingEvent) => void,
  {
    isDeviceOnboarded = false,
    onUpdateCompleted = jest.fn(),
  }: { isDeviceOnboarded?: boolean; onUpdateCompleted?: () => void } = {},
) {
  const props = { machineState: delegated };
  const rendered = renderHook(() =>
    useFirmwareUpdateHandover({
      device,
      isDeviceOnboarded,
      machineState: props.machineState,
      send,
      onUpdateCompleted,
    }),
  );

  return {
    ...rendered,
    rerender: ({ machineState }: { machineState: string }) => {
      props.machineState = machineState;
      rendered.rerender(undefined);
    },
  };
}

function reportFirmware(
  status: "idle" | "ongoing" | "error" | "no-available-firmware" | "available-firmware",
  nextDeviceInfo: unknown = null,
  nextFirmwareUpdateContext: unknown = null,
) {
  mockFirmwareState(status, nextDeviceInfo, nextFirmwareUpdateContext);
}

function mockFirmwareState(
  status: "idle" | "ongoing" | "error" | "no-available-firmware" | "available-firmware",
  nextDeviceInfo: unknown = null,
  nextFirmwareUpdateContext: unknown = null,
) {
  mockedUseGetLatestAvailableFirmware.mockReturnValue({
    state: {
      status,
      deviceInfo: nextDeviceInfo,
      firmwareUpdateContext: nextFirmwareUpdateContext,
    },
  } as ReturnType<typeof useGetLatestAvailableFirmware>);
}
