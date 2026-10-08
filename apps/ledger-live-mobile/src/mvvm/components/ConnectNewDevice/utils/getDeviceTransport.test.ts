import {
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  speculosIdentifier,
} from "@ledgerhq/live-dmk-mobile";
import { getDeviceTransport } from "./getDeviceTransport";

describe("getDeviceTransport", () => {
  it.each([
    { transport: rnHidTransportIdentifier, expected: "usb" },
    { transport: rnBleTransportIdentifier, expected: "bluetooth" },
    { transport: speculosIdentifier, expected: "bluetooth" },
  ])("should return $expected for $transport", ({ transport, expected }) => {
    expect(getDeviceTransport(transport)).toBe(expected);
  });
});
