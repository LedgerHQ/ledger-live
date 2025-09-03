import { DeviceModelId } from "@ledgerhq/devices";
import { isCharonSupported } from "./isCharonSupported";

const { nanoS, nanoX, stax, europa, nanoSP, apex } = DeviceModelId;

test("isHardwareVersionSupported", () => {
  /**
   * Nano S
   * */
  expect(isCharonSupported("2.0.0", nanoS)).toBe(false);
  expect(isCharonSupported("2.0.0-whatever0", nanoS)).toBe(false);

  /**
   * Nano X
   * */
  expect(isCharonSupported("1.9.0", nanoX)).toBe(false);
  expect(isCharonSupported("1.9.0-whatever0", nanoX)).toBe(false);

  /**
   * Nano SP
   * */
  expect(isCharonSupported("2.0.0", nanoSP)).toBe(false);
  expect(isCharonSupported("2.0.0-whatever0", nanoSP)).toBe(false);

  /**
   * Stax
   * */
  expect(isCharonSupported("1.9.0", stax)).toBe(true);
  expect(isCharonSupported("1.9.0-whatever0", stax)).toBe(true);

  expect(isCharonSupported("1.7.0", stax)).toBe(true);
  expect(isCharonSupported("1.7.0-whatever0", stax)).toBe(true);

  expect(isCharonSupported("1.3.0", stax)).toBe(false);
  expect(isCharonSupported("1.3.0-whatever0", stax)).toBe(false);

  /**
   * Europa
   * */
  expect(isCharonSupported("1.6.0", europa)).toBe(true);
  expect(isCharonSupported("1.6.0-whatever0", europa)).toBe(true);

  expect(isCharonSupported("1.3.0", europa)).toBe(true);
  expect(isCharonSupported("1.3.0-whatever0", europa)).toBe(true);

  expect(isCharonSupported("1.2.0", europa)).toBe(false);
  expect(isCharonSupported("1.2.0-whatever0", europa)).toBe(false);

  /**
   * Apex
   * */
  expect(isCharonSupported("0.0.0", apex)).toBe(true);
  expect(isCharonSupported("0.0.0-whatever0", apex)).toBe(true);
});
