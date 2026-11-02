import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import type { Device, OsUpdate } from "@ledgerhq/live-dmk-shared";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useOsUpdateFlowViewModel } from "./useOsUpdateFlowViewModel";

const mockGetActiveConnectedDevice = jest.fn();
const mockReset = jest.fn();
const mockGoBack = jest.fn();
const mockDmk = {};

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  useDeviceManagementKit: () => mockDmk,
  getActiveConnectedDevice: (...args: unknown[]) => mockGetActiveConnectedDevice(...args),
  rnBleTransportIdentifier: "RN_BLE",
  rnHidTransportIdentifier: "RN_HID",
}));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ reset: mockReset, goBack: mockGoBack }),
}));

const device: Device = {
  id: "id",
  name: null,
  deviceModelId: DeviceModelId.europa,
  transport: rnBleTransportIdentifier,
};
const connectedDevice = { sessionId: "session" } as ConnectedDevice;
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "notes" },
} as OsUpdate;

const withOsUpdates = (osUpdates: OsUpdate[], hasBackup = false) => ({
  overrideInitialState: (state: State): State => ({
    ...state,
    osUpdate: { osUpdates, hasBackup },
  }),
});

describe("useOsUpdateFlowViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveConnectedDevice.mockReturnValue(connectedDevice);
  });

  it("shows the What's new of the last update, then starts the orchestrator on confirmation", () => {
    const { result } = renderHook(
      () => useOsUpdateFlowViewModel(device),
      withOsUpdates([osUpdate]),
    );

    expect(mockGetActiveConnectedDevice).toHaveBeenCalledWith(mockDmk, { wired: false });
    expect(result.current.whatsNew).toEqual({ version: "1.8.0", notes: "notes" });
    expect(result.current.orchestratorRun).toBeNull();

    act(() => result.current.onConfirmStart());

    expect(result.current.orchestratorRun).toMatchObject({
      dmk: mockDmk,
      connectedDevice,
      osUpdates: [osUpdate],
      onStop: expect.any(Function),
    });
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("clears the updates and the backup once completed, and keeps the run going", () => {
    const { result, store } = renderHook(
      () => useOsUpdateFlowViewModel(device),
      withOsUpdates([osUpdate], true),
    );
    act(() => result.current.onConfirmStart());

    act(() => result.current.orchestratorRun?.onCompleted());

    expect(store.getState().osUpdate.osUpdates).toEqual([]);
    expect(store.getState().osUpdate.hasBackup).toBe(false);
    expect(result.current.orchestratorRun).not.toBeNull();
  });

  it("only goes back to My Ledger when the What's new is closed", () => {
    const { result } = renderHook(
      () => useOsUpdateFlowViewModel(device),
      withOsUpdates([osUpdate]),
    );

    act(() => result.current.onClose());

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("reconnects through My Ledger when the flow is stopped", () => {
    const { result } = renderHook(
      () => useOsUpdateFlowViewModel(device),
      withOsUpdates([osUpdate]),
    );
    act(() => result.current.onConfirmStart());

    act(() => result.current.orchestratorRun?.onStop());

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["there is no update", [], connectedDevice],
    ["the device of the session is not found", [osUpdate], undefined],
  ])("goes back to My Ledger when %s", (_label, osUpdates, active) => {
    mockGetActiveConnectedDevice.mockReturnValue(active);

    renderHook(() => useOsUpdateFlowViewModel(device), withOsUpdates(osUpdates));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
  describe("bootloader repair", () => {
    it("starts the orchestrator right away with no update, without What's new", () => {
      const { result } = renderHook(
        () => useOsUpdateFlowViewModel(device, OsUpdateFlowMode.BOOTLOADER_REPAIR),
        withOsUpdates([osUpdate]),
      );

      expect(result.current.whatsNew).toBeNull();
      expect(result.current.orchestratorRun).toMatchObject({ connectedDevice, osUpdates: [] });
      expect(mockReset).not.toHaveBeenCalled();
    });

    it("leaves My Ledger with no device selected when stopped", () => {
      const { result } = renderHook(
        () => useOsUpdateFlowViewModel(device, OsUpdateFlowMode.BOOTLOADER_REPAIR),
        withOsUpdates([]),
      );

      act(() => result.current.orchestratorRun?.onStop());

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(mockReset.mock.calls[0][0])).not.toContain('"device"');
    });
  });

  describe("restore backup", () => {
    it("starts the orchestrator right away with no update, without What's new", () => {
      const { result } = renderHook(
        () => useOsUpdateFlowViewModel(device, OsUpdateFlowMode.RESTORE_BACKUP),
        withOsUpdates([]),
      );

      expect(result.current.whatsNew).toBeNull();
      expect(result.current.orchestratorRun).toMatchObject({ connectedDevice, osUpdates: [] });
      expect(mockReset).not.toHaveBeenCalled();
    });

    it("goes back to My Ledger with the device, so the backup is checked again", () => {
      const { result } = renderHook(
        () => useOsUpdateFlowViewModel(device, OsUpdateFlowMode.RESTORE_BACKUP),
        withOsUpdates([]),
      );

      act(() => result.current.orchestratorRun?.onStop());

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(mockReset.mock.calls[0][0])).toContain('"device"');
    });
  });
});
