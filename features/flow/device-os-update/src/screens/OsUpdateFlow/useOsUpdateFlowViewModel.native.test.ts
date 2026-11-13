// oxlint-disable typescript/consistent-type-assertions
import {
  DeviceModelId,
  type ConnectedDevice,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { OsUpdateFlowMode } from "../../types/OsUpdateFlowMode";
import type { OsUpdateDevice } from "../../types/OsUpdateDevice";
import { act, createFakePorts, renderHook } from "../../__tests__/render";
import { useOsUpdateFlowViewModel } from "./useOsUpdateFlowViewModel";

const device: OsUpdateDevice = {
  id: "id",
  name: null,
  modelId: DeviceModelId.FLEX,
  wired: false,
};
const connectedDevice = { sessionId: "session", type: "BLE" } as ConnectedDevice;
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "notes" },
} as OsUpdate;

function setup({
  osUpdates = [osUpdate],
  hasBackup = false,
  mode,
  sessions = [connectedDevice],
}: {
  osUpdates?: OsUpdate[];
  hasBackup?: boolean;
  mode?: OsUpdateFlowMode;
  sessions?: ConnectedDevice[];
} = {}) {
  const onClose = jest.fn();
  const onReconnect = jest.fn();
  const listConnectedDevices = jest.fn(() => sessions);
  const ports = createFakePorts({
    dmk: { listConnectedDevices } as unknown as DeviceManagementKit,
  });
  const hook = renderHook(() => useOsUpdateFlowViewModel({ device, mode, onClose, onReconnect }), {
    ports,
    deviceOsUpdate: { osUpdates, hasBackup },
  });
  return { ...hook, onClose, onReconnect, ports };
}

describe("useOsUpdateFlowViewModel", () => {
  it("shows the What's new of the last update, then starts the orchestrator on confirmation", () => {
    const { result, ports, onReconnect } = setup();

    expect(result.current.whatsNew).toEqual({ version: "1.8.0", notes: "notes" });
    expect(result.current.orchestratorRun).toBeNull();

    act(() => result.current.onConfirmStart());

    expect(result.current.orchestratorRun).toMatchObject({
      dmk: ports.dmk,
      connectedDevice,
      osUpdates: [osUpdate],
      backupStorage: ports.backupStorage,
      onStop: expect.any(Function),
    });
    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("keeps the screen awake once the update is started", () => {
    const { result, ports } = setup();

    expect(ports.keepScreenAwake).not.toHaveBeenCalled();
    act(() => result.current.onConfirmStart());

    expect(ports.keepScreenAwake).toHaveBeenCalledTimes(1);
  });

  it("opens the OS release notes of the device model", () => {
    const { result, ports } = setup();

    act(() => result.current.onOpenReleaseNotes());

    expect(ports.openUrl).toHaveBeenCalledWith(
      "https://support.ledger.com/article/Ledger-Flex-OS-release",
    );
  });

  it("clears the updates and the backup once completed, and keeps the run going", () => {
    const { result, store } = setup({ hasBackup: true });
    act(() => result.current.onConfirmStart());

    act(() => result.current.orchestratorRun?.onCompleted());

    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
    expect(store.getState().deviceOsUpdate.hasBackup).toBe(false);
    expect(result.current.orchestratorRun).not.toBeNull();
  });

  it("only leaves the flow when the What's new is closed", () => {
    const { result, onClose, onReconnect } = setup();

    act(() => result.current.onClose());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("reconnects the device through My Ledger when the flow is stopped", () => {
    const { result, onReconnect } = setup();
    act(() => result.current.onConfirmStart());

    act(() => result.current.orchestratorRun?.onStop());

    expect(onReconnect).toHaveBeenCalledWith(device);
  });

  it.each([
    ["there is no update", { osUpdates: [] }],
    ["no session is open on the connection of the device", { sessions: [] }],
    [
      "the session is open on another connection",
      { sessions: [{ ...connectedDevice, type: "USB" } as ConnectedDevice] },
    ],
  ])("goes back to My Ledger when %s", (_label, options) => {
    const { onReconnect } = setup(options);

    expect(onReconnect).toHaveBeenCalledWith(device);
  });

  it("sends the Ledger Wallet model id and the last seen OS version in analytics", () => {
    const { result } = setup();

    expect(result.current.analytics).toMatchObject({
      analyticsModelId: "europa",
      wired: false,
      updateCount: 1,
      osVersionTo: "1.8.0",
    });
  });

  describe("bootloader repair", () => {
    it("starts the orchestrator right away with no update, without What's new", () => {
      const { result, onReconnect } = setup({ mode: OsUpdateFlowMode.BOOTLOADER_REPAIR });

      expect(result.current.whatsNew).toBeNull();
      expect(result.current.orchestratorRun).toMatchObject({ connectedDevice, osUpdates: [] });
      expect(onReconnect).not.toHaveBeenCalled();
    });

    it("leaves My Ledger with no device selected when stopped", () => {
      const { result, onReconnect } = setup({
        mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
        osUpdates: [],
      });

      act(() => result.current.orchestratorRun?.onStop());

      expect(onReconnect).toHaveBeenCalledWith(undefined);
    });
  });

  describe("restore backup", () => {
    it("starts the orchestrator right away with no update, without What's new", () => {
      const { result, onReconnect } = setup({
        mode: OsUpdateFlowMode.RESTORE_BACKUP,
        osUpdates: [],
      });

      expect(result.current.whatsNew).toBeNull();
      expect(result.current.orchestratorRun).toMatchObject({ connectedDevice, osUpdates: [] });
      expect(onReconnect).not.toHaveBeenCalled();
    });

    it("goes back to My Ledger with the device, so the backup is checked again", () => {
      const { result, onReconnect } = setup({
        mode: OsUpdateFlowMode.RESTORE_BACKUP,
        osUpdates: [],
      });

      act(() => result.current.orchestratorRun?.onStop());

      expect(onReconnect).toHaveBeenCalledWith(device);
    });
  });
});
