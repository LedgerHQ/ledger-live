import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { renderHook } from "../__tests__/render";
import { stax } from "../utils/connectedDevice.mock";
import { useOsUpdateDevice } from "./useOsUpdateDevice";

describe("useOsUpdateDevice", () => {
  it("shows the device model from the ports with the name of the connected device", () => {
    const { result, ports } = renderHook(() => useOsUpdateDevice(stax));

    expect(result.current).toEqual({
      ...ports.getDeviceModel(DeviceModelId.STAX),
      deviceName: "Ledger Stax",
    });
  });
});
