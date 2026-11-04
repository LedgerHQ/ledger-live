import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { renderHook } from "@tests/test-renderer";
import { useBackupSelectionContentViewModel } from "./useBackupSelectionContentViewModel";

let mockLocale = "en";

jest.mock("~/context/Locale", () => ({ useLocale: () => ({ locale: mockLocale }) }));

const backupCreatedAt = new Date(2026, 8, 12, 0, 30);

describe("useBackupSelectionContentViewModel", () => {
  it("exposes the device name", () => {
    const { result } = renderHook(() =>
      useBackupSelectionContentViewModel(DeviceModelId.europa, backupCreatedAt),
    );

    expect(result.current.productName).toBe(getDeviceModel(DeviceModelId.europa).productName);
  });

  it.each([
    ["en", { date: "September 12", time: "12:30AM" }],
    ["fr", { date: "12 septembre", time: "0:30" }],
  ])("formats the date of the last save in %s", (locale, expected) => {
    mockLocale = locale;
    const { result } = renderHook(() =>
      useBackupSelectionContentViewModel(DeviceModelId.europa, backupCreatedAt),
    );

    expect(result.current.lastSave).toEqual(expected);
  });
});
