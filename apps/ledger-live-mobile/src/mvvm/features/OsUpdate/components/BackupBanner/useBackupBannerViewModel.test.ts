import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { useBackupBannerViewModel } from "./useBackupBannerViewModel";

const mockNavigate = jest.fn();
const mockRemoveBackup = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("../../storage/deviceBackupStorage", () => ({
  deviceBackupStorage: { removeBackup: (...args: unknown[]) => mockRemoveBackup(...args) },
}));

const device: Device = { deviceId: "id", modelId: DeviceModelId.europa, wired: false };
const osUpdate = { finalFirmware: { version: "1.8.0" } } as OsUpdate;

const withState = (hasBackup: boolean, osUpdates: OsUpdate[] = []) => ({
  overrideInitialState: (state: State): State => ({ ...state, osUpdate: { osUpdates, hasBackup } }),
});

describe("useBackupBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemoveBackup.mockResolvedValue(undefined);
  });

  it.each([
    ["a backup and no OS update", true, [], true],
    ["no backup", false, [], false],
    ["an OS update available", true, [osUpdate], false],
  ])("visibility with %s", (_label, hasBackup, osUpdates, expected) => {
    const { result } = renderHook(
      () => useBackupBannerViewModel(device),
      withState(hasBackup, osUpdates),
    );

    expect(result.current.isVisible).toBe(expected);
  });

  it("asks for confirmation, then launches the restore", () => {
    const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

    act(() => result.current.onRestore());
    expect(result.current.confirmation).toBe("restore");
    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => result.current.onConfirmRestore());
    expect(result.current.confirmation).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OsUpdate, {
      device,
      mode: "restoreBackup",
    });
  });

  it("asks for confirmation, then deletes the backup and hides the banner", async () => {
    const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

    act(() => result.current.onDelete());
    expect(result.current.confirmation).toBe("delete");
    expect(mockRemoveBackup).not.toHaveBeenCalled();

    await act(() => result.current.onConfirmDelete());

    expect(mockRemoveBackup).toHaveBeenCalledWith(DMKDeviceModelId.FLEX);
    expect(result.current.isVisible).toBe(false);
  });

  it("keeps the banner when the backup cannot be deleted", async () => {
    mockRemoveBackup.mockRejectedValue(new Error("storage"));
    const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

    act(() => result.current.onDelete());
    await act(() => result.current.onConfirmDelete());

    expect(result.current.isVisible).toBe(true);
  });

  it("does nothing when the confirmation is cancelled", () => {
    const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

    act(() => result.current.onDelete());
    act(() => result.current.onCancelConfirmation());

    expect(result.current.confirmation).toBeNull();
    expect(mockRemoveBackup).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
