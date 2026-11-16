import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { track, trackPage } from "@shared/analytics";
import type { OsUpdate } from "@domain/entity-device-os-update";
import { act, renderHook } from "../../__tests__/render";
import { useBackupBannerViewModel, type BackupBannerProps } from "./useBackupBannerViewModel";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/analyticsTypes";

const mockOnRestore = jest.fn();
const mockRemoveBackup = jest.fn();

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const device: BackupBannerProps = {
  modelId: DeviceModelId.FLEX,
  wired: false,
  analyticsModelId: "europa",
  backupStorage: {
    getBackup: jest.fn(),
    saveBackup: jest.fn(),
    removeBackup: (...args: unknown[]) => mockRemoveBackup(...args),
  },
  onRestore: mockOnRestore,
};
const osUpdate = { finalFirmware: { version: "1.8.0" } } as OsUpdate;

const withState = (hasBackup: boolean, osUpdates: OsUpdate[] = []) => ({
  deviceOsUpdate: { osUpdates, hasBackup },
});

describe("useBackupBannerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemoveBackup.mockResolvedValue(undefined);
  });

  it.each([
    ["a backup and no OS update", true, [], true],
    ["a backup and an OS update available", true, [osUpdate], true],
    ["no backup", false, [], false],
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
    expect(mockOnRestore).not.toHaveBeenCalled();

    act(() => result.current.onConfirmRestore());
    expect(result.current.confirmation).toBeNull();
    expect(mockOnRestore).toHaveBeenCalledTimes(1);
  });

  it("asks for confirmation, then deletes the backup and hides the banner", async () => {
    const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

    act(() => result.current.onDelete());
    expect(result.current.confirmation).toBe("delete");
    expect(mockRemoveBackup).not.toHaveBeenCalled();

    await act(() => result.current.onConfirmDelete());

    expect(mockRemoveBackup).toHaveBeenCalledWith(DeviceModelId.FLEX);
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
    expect(mockOnRestore).not.toHaveBeenCalled();
  });

  describe("tracking", () => {
    const shared = {
      platform: "lwm",
      modelId: "europa",
      transport: "ble",
      mode: "restoreBackup",
      updateCount: 0,
    };

    it("tracks the banner, the restore confirmation and its buttons", () => {
      const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

      act(() => result.current.onRestore());
      act(() => result.current.onConfirmRestore());

      expect(jest.mocked(trackPage).mock.calls).toEqual([
        [{ category: OsUpdatePage.BACKUP_BANNER, props: shared }],
        [{ category: OsUpdatePage.RESTORE_CONFIRMATION, props: shared }],
      ]);
      expect(jest.mocked(track).mock.calls).toEqual([
        [
          "button_clicked",
          { button: OsUpdateButton.RESTORE, page: OsUpdatePage.BACKUP_BANNER, ...shared },
        ],
        [
          "button_clicked",
          { button: OsUpdateButton.RESTORE, page: OsUpdatePage.RESTORE_CONFIRMATION, ...shared },
        ],
      ]);
    });

    it("tracks a cancelled delete confirmation, but not its dismissal", () => {
      const { result } = renderHook(() => useBackupBannerViewModel(device), withState(true));

      act(() => result.current.onDelete());
      act(() => result.current.onCancelConfirmation());
      act(() => result.current.onDelete());
      act(() => result.current.onDismissConfirmation());

      expect(jest.mocked(trackPage)).toHaveBeenCalledWith({
        category: OsUpdatePage.DELETE_CONFIRMATION,
        props: shared,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: OsUpdateButton.CANCEL,
        page: OsUpdatePage.DELETE_CONFIRMATION,
        ...shared,
      });
      // Delete, Cancel, then Delete again: the dismissal is not a click.
      expect(track).toHaveBeenCalledTimes(3);
    });

    it("does not track the pages again when rerendered with an equivalent device", () => {
      let currentDevice = device;
      const { result, rerender } = renderHook(
        () => useBackupBannerViewModel(currentDevice),
        withState(true),
      );

      act(() => result.current.onRestore());
      currentDevice = { ...device };
      rerender({});

      expect(jest.mocked(trackPage).mock.calls).toEqual([
        [{ category: OsUpdatePage.BACKUP_BANNER, props: shared }],
        [{ category: OsUpdatePage.RESTORE_CONFIRMATION, props: shared }],
      ]);
    });

    it("does not track a hidden banner", () => {
      renderHook(() => useBackupBannerViewModel(device), withState(false));

      expect(trackPage).not.toHaveBeenCalled();
    });
  });
});
