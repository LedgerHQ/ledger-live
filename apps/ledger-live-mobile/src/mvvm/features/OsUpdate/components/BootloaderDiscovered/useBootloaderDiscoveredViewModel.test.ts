import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { track, trackPage } from "@shared/analytics";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/types";
import { useBootloaderDiscoveredViewModel } from "./useBootloaderDiscoveredViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(() => Promise.resolve()),
  trackPage: jest.fn(),
}));

const device: Device = {
  id: "id",
  name: "Ledger Stax",
  deviceModelId: DeviceModelId.stax,
  transport: rnBleTransportIdentifier,
};
const shared = {
  platform: "lwm",
  modelId: DeviceModelId.stax,
  transport: "ble",
  mode: "bootloaderRepair",
};

describe("useBootloaderDiscoveredViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not track the page again when rerendered with an equivalent device", () => {
    let currentDevice = device;
    const { rerender } = renderHook(() => useBootloaderDiscoveredViewModel(currentDevice));

    currentDevice = { ...device };
    rerender({});

    expect(trackPage).toHaveBeenCalledTimes(1);
  });

  it("tracks the bootloader page, then opens the repair on continue", () => {
    const { result } = renderHook(() => useBootloaderDiscoveredViewModel(device));

    expect(trackPage).toHaveBeenCalledWith({
      category: OsUpdatePage.BOOTLOADER_DETECTED,
      props: shared,
    });

    act(() => result.current.onContinue());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: OsUpdateButton.CONTINUE,
      page: OsUpdatePage.BOOTLOADER_DETECTED,
      ...shared,
    });
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OsUpdate, {
      device,
      mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
    });
  });
});
