import { DeviceModelId } from "@ledgerhq/devices";
import { isHardwareVersionSupported } from "./isHardwareVersionSupported";

const { nanoS, nanoSP, nanoX, stax } = DeviceModelId;

test("isHardwareVersionSupported", () => {
  /**
   * Nano S
   * */
  expect(isHardwareVersionSupported("2.0.0", nanoS)).toBe(false);
  expect(isHardwareVersionSupported("2.0.0-whatever0", nanoS)).toBe(false);

  /**
   * Nano X
   * */
  expect(isHardwareVersionSupported("1.9.0", nanoX)).toBe(false);
  expect(isHardwareVersionSupported("1.9.0-whatever0", nanoX)).toBe(false);

  expect(isHardwareVersionSupported("2.0.0", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("2.0.0-rc1", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("2.0.1", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("2.0.1-whatever0", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("2.1.0", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("2.1.0-whatever0", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("3.0.0", nanoX)).toBe(true);
  expect(isHardwareVersionSupported("3.0.0-whatever0", nanoX)).toBe(true);

  /**
   * Nano SP
   * */
  expect(isHardwareVersionSupported("2.0.0", nanoSP)).toBe(false);
  expect(isHardwareVersionSupported("2.0.0-whatever0", nanoSP)).toBe(false);

  /**
   * Stax
   * */
  expect(isHardwareVersionSupported("2.0.0", stax)).toBe(false);
  expect(isHardwareVersionSupported("2.0.0-whatever0", stax)).toBe(false);
});
