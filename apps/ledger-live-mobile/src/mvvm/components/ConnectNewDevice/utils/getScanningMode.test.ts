import {
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  speculosIdentifier,
} from "@ledgerhq/live-dmk-mobile";
import { getScanningMode } from "./getScanningMode";

describe("getScanningMode", () => {
  it.each([
    { transports: [rnBleTransportIdentifier], mode: "bluetooth" },
    { transports: [rnBleTransportIdentifier, rnHidTransportIdentifier], mode: "bluetoothAndUsb" },
    { transports: [rnHidTransportIdentifier], mode: "usb" },
    { transports: [rnBleTransportIdentifier, speculosIdentifier], mode: "bluetooth" },
    { transports: [rnHidTransportIdentifier, speculosIdentifier], mode: "usb" },
    { transports: [], mode: "bluetooth" },
  ])("should return $mode when scanning $transports", ({ transports, mode }) => {
    expect(getScanningMode(transports)).toBe(mode);
  });
});
