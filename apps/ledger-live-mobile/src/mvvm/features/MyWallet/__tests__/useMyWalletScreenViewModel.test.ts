import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { State } from "~/reducers/types";
import { useMyWalletScreenViewModel } from "../useMyWalletScreenViewModel";

const withKnownStaxAndNanoX = (state: State): State => ({
  ...state,
  knownDevices: {
    ...state.knownDevices,
    knownDevices: [
      {
        id: "stax-id",
        name: "Ledger Stax",
        deviceModelId: DeviceModelId.stax,
        transport: rnBleTransportIdentifier,
      },
      {
        id: "nano-x-id",
        name: "Ledger Nano X",
        deviceModelId: DeviceModelId.nanoX,
        transport: rnBleTransportIdentifier,
      },
    ],
  },
});

const renderViewModel = (isDeviceListEnabled: boolean) =>
  renderHook(() => useMyWalletScreenViewModel(), {
    overrideInitialState: withFlagOverrides(
      { lwmMyWalletDeviceList: { enabled: isDeviceListEnabled } },
      withKnownStaxAndNanoX,
    ),
  });

describe("useMyWalletScreenViewModel", () => {
  it("GIVEN the device list and two known devices, WHEN the screen renders, THEN it should give the device count and the sorted device models to the page", () => {
    // GIVEN / WHEN
    const { result } = renderViewModel(true);

    // THEN
    expect(result.current.pageProperties).toEqual({
      numberOfDevices: 2,
      deviceModels: [DeviceModelId.nanoX, DeviceModelId.stax],
    });
  });

  it("GIVEN the device list is off, WHEN the screen renders, THEN it should give no device properties to the page", () => {
    // GIVEN / WHEN
    const { result } = renderViewModel(false);

    // THEN
    expect(result.current.pageProperties).toEqual({});
  });
});
