import React from "react";
import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { OsUpdateFlowMode } from "@features/flow-device-os-update";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { render, screen, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import { deviceBackupStorage } from "../../storage/deviceBackupStorage";
import { BackupBanner } from "./index";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../storage/deviceBackupStorage", () => ({
  deviceBackupStorage: {
    getBackup: jest.fn(),
    saveBackup: jest.fn(),
    removeBackup: jest.fn(() => Promise.resolve()),
  },
}));

const device = { deviceId: "usb|1", modelId: DeviceModelId.europa, wired: true } as Device;

const withBackup = (state: State): State => ({
  ...state,
  deviceOsUpdate: { osUpdates: [], hasBackup: true },
});

describe("BackupBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the OS update flow in restore mode for the device once the restore is confirmed", async () => {
    const { user } = render(<BackupBanner device={device} />, { overrideInitialState: withBackup });

    await user.press(screen.getByTestId("backup-banner-restore"));
    await user.press(await screen.findByTestId("backup-restore-confirmation-confirm"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OsUpdate, {
      device: expect.objectContaining({ id: "usb|1", deviceModelId: DeviceModelId.europa }),
      mode: OsUpdateFlowMode.RESTORE_BACKUP,
    });
  });

  it("discards the backup kept in the app storage under the DMK model of the device", async () => {
    const { user } = render(<BackupBanner device={device} />, { overrideInitialState: withBackup });

    await user.press(screen.getByTestId("backup-banner-delete"));
    await user.press(await screen.findByTestId("backup-delete-confirmation-confirm"));

    expect(deviceBackupStorage.removeBackup).toHaveBeenCalledWith(DmkDeviceModelId.FLEX);
    await waitFor(() => expect(screen.queryByTestId("backup-banner")).toBeNull());
  });
});
