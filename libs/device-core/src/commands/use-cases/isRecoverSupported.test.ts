import { DeviceModelId } from "@ledgerhq/devices";
import { isRecoverSupported } from "./isRecoverSupported";

const { nanoS, nanoX, stax, europa, nanoSP } = DeviceModelId;

test("isRecoverSupported", () => {
  /**
   * Nano S
   * */
  expect(isRecoverSupported("2.0.0", nanoS)).toBe(false);
  expect(isRecoverSupported("2.0.0-whatever0", nanoS)).toBe(false);

  /**
   * Nano SP
   * */
  expect(isRecoverSupported("2.0.0", nanoSP)).toBe(true);
  expect(isRecoverSupported("2.0.0-whatever0", nanoSP)).toBe(true);

  expect(isRecoverSupported("1.1.0", nanoSP)).toBe(true);
  expect(isRecoverSupported("1.1.0-whatever0", nanoSP)).toBe(true);

  expect(isRecoverSupported("1.0.0", nanoSP)).toBe(false);
  expect(isRecoverSupported("1.0.0-whatever0", nanoSP)).toBe(false);

  /**
   * Nano X
   * */
  expect(isRecoverSupported("2.5.0", nanoX)).toBe(true);
  expect(isRecoverSupported("2.5.0-whatever0", nanoX)).toBe(true);

  expect(isRecoverSupported("2.1.0", nanoX)).toBe(true);
  expect(isRecoverSupported("2.1.0-whatever0", nanoX)).toBe(true);

  expect(isRecoverSupported("2.0.0", nanoX)).toBe(false);
  expect(isRecoverSupported("2.0.0-whatever0", nanoX)).toBe(false);

  expect(isRecoverSupported("1.9.0", nanoX)).toBe(false);
  expect(isRecoverSupported("1.9.0-whatever0", nanoX)).toBe(false);

  /**
   * Stax
   * */
  expect(isRecoverSupported("1.9.0", stax)).toBe(true);
  expect(isRecoverSupported("1.9.0-whatever0", stax)).toBe(true);

  expect(isRecoverSupported("1.0.0", stax)).toBe(true);
  expect(isRecoverSupported("1.0.0-whatever0", stax)).toBe(true);

  expect(isRecoverSupported("0.0.0", stax)).toBe(false);
  expect(isRecoverSupported("0.0.0-whatever0", stax)).toBe(false);

  /**
   * Europa
   * */
  expect(isRecoverSupported("0.0.0", europa)).toBe(true);
  expect(isRecoverSupported("0.0.0-whatever0", europa)).toBe(true);

  expect(isRecoverSupported("1.4.0", europa)).toBe(true);
  expect(isRecoverSupported("1.4.0-whatever0", europa)).toBe(true);
});
