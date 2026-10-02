import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import { act, renderHook, waitFor } from "tests/testSetup";
import { NEVER } from "rxjs";
import { useDeviceOnboarding } from "../hooks/useDeviceOnboarding";
import { useFirmwareUpdateHandover } from "../hooks/useFirmwareUpdateHandover";
import { createDeviceOnboardingPorts } from "../utils/ports";

const openSession = jest.fn();
const getConnectedDevice = jest.fn();

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  DeviceManagementKitTransport: {
    open: () => openSession(),
  },
  getDeviceManagementKit: () => ({
    getConnectedDevice: (input: { sessionId: string }) => getConnectedDevice(input),
    getDeviceSessionState: () => NEVER,
    sendCommand: () => new Promise(() => undefined),
  }),
}));

const firmwareLookup: {
  status: string;
  deviceInfo: DeviceInfo | null;
  firmwareUpdateContext: FirmwareUpdateContext | null;
} = {
  status: "idle",
  deviceInfo: null,
  firmwareUpdateContext: null,
};

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => ({
  useGetLatestAvailableFirmware: () => ({ state: firmwareLookup }),
}));

const setDrawer = jest.fn();
jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: (...args: unknown[]) => setDrawer(...args),
}));

jest.mock("~/renderer/modals/UpdateFirmwareModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("~/renderer/screens/manager/FirmwareUpdate", () => ({
  initialStepId: () => "idCheck",
}));

const connectedDevice = {
  id: "device-id",
  name: "Nano X",
  modelId: DmkDeviceModelId.NANO_X,
};

type PublishedTransport = NonNullable<(typeof activeDeviceSessionSubject)["value"]>["transport"];

function publishTransport(sessionId: string): PublishedTransport {
  const transport = { sessionId, close: jest.fn() } as unknown as PublishedTransport;
  activeDeviceSessionSubject.next({ sessionId, transport });
  return transport;
}

describe("DeviceOnboarding desktop integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeDeviceSessionSubject.next(null);
    firmwareLookup.status = "idle";
    firmwareLookup.deviceInfo = null;
    firmwareLookup.firmwareUpdateContext = null;
    getConnectedDevice.mockReturnValue(connectedDevice);
    openSession.mockImplementation(async () => {
      const current = activeDeviceSessionSubject.value?.transport;
      if (current) return current;
      return publishTransport("session-1");
    });
  });

  it("should reuse the published session when open is called again", async () => {
    const first = createDeviceOnboardingPorts();
    await first.openSession();
    const published = activeDeviceSessionSubject.value?.transport;

    const second = createDeviceOnboardingPorts();
    await second.openSession();

    expect(activeDeviceSessionSubject.value?.transport).toBe(published);
    expect(openSession).toHaveBeenCalledTimes(2);
  });

  it("should follow the session id when the published transport is replaced", async () => {
    const ports = createDeviceOnboardingPorts();
    await ports.openSession();

    publishTransport("session-3");

    expect(ports.currentSessionId()).toBe("session-3");
  });

  it("should follow the session id when the transport reconnects without republishing", async () => {
    const ports = createDeviceOnboardingPorts();
    await ports.openSession();

    const transport = activeDeviceSessionSubject.value?.transport;
    expect(transport?.sessionId).toBe("session-1");
    if (!transport) return;
    transport.sessionId = "session-after-reboot";

    expect(activeDeviceSessionSubject.value?.sessionId).toBe("session-1");
    expect(ports.currentSessionId()).toBe("session-after-reboot");
  });

  it("should resume the machine from the live session after the transport is lost", async () => {
    const { result } = renderHook(() => useDeviceOnboarding());

    act(() => result.current.connect());
    await waitFor(() => expect(result.current.status).toBe("running"));
    expect(result.current.device?.sessionId).toBe("session-1");

    act(() => {
      activeDeviceSessionSubject.next(null);
    });
    await waitFor(() => expect(result.current.state).toBe("awaitingSession"));
    expect(result.current.device).toBeNull();

    act(() => {
      publishTransport("session-2");
    });

    await waitFor(() => expect(result.current.device?.sessionId).toBe("session-2"));
    expect(result.current.state).toBe("readingState");
  });

  it("should send FIRMWARE_UPDATE_FLOW_CLOSED once when both drawer closes fire", () => {
    const send = jest.fn();
    const device = {
      deviceId: "device-id",
      deviceName: "Nano X",
      modelId: DeviceModelId.nanoX,
      wired: true,
    } satisfies Device;

    firmwareLookup.status = "available-firmware";
    firmwareLookup.deviceInfo = {
      version: "2.2.0",
      isOSU: false,
      mcuVersion: "1.0",
    } as DeviceInfo;
    firmwareLookup.firmwareUpdateContext = {
      osu: {},
      final: { name: "2.3.0" },
      shouldFlashMCU: false,
    } as FirmwareUpdateContext;

    renderHook(() =>
      useFirmwareUpdateHandover({
        device,
        machineState: "checks.firmwareUpdateDelegated",
        send,
      }),
    );

    const drawerProps = setDrawer.mock.calls[0]?.[1] as {
      onDrawerClose: () => void;
      onRequestClose: () => void;
    };

    act(() => {
      drawerProps.onDrawerClose();
      drawerProps.onRequestClose();
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
  });
});
