import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { State } from "~/reducers/types";
import { useMyWalletScreenViewModel } from "../useMyWalletScreenViewModel";

const withKnownDevices = (state: State): State => ({
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
      {
        id: "nano-s-plus-id",
        name: "Ledger Nano S Plus",
        deviceModelId: DeviceModelId.nanoSP,
        transport: rnHidTransportIdentifier,
      },
    ],
  },
});

const renderViewModel = (isDeviceListEnabled: boolean) =>
  renderHook(() => useMyWalletScreenViewModel(), {
    overrideInitialState: withFlagOverrides(
      { lwmMyWalletDeviceList: { enabled: isDeviceListEnabled } },
      withKnownDevices,
    ),
  });

describe("useMyWalletScreenViewModel", () => {
  it("GIVEN the device list and Bluetooth and USB known devices, WHEN the screen renders, THEN it should give the count and the sorted models of the Bluetooth known devices to the page", () => {
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
