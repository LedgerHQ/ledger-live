import { DeviceModelId } from "@ledgerhq/devices";
import { isRecoveryKeySupported } from "./isRecoveryKeySupported";

const { nanoS, nanoX, stax, europa, nanoSP } = DeviceModelId;

test("isHardwareVersionSupported", () => {
  /**
   * Nano S
   * */
  expect(isRecoveryKeySupported("2.0.0", nanoS)).toBe(false);
  expect(isRecoveryKeySupported("2.0.0-whatever0", nanoS)).toBe(false);

  /**
   * Nano X
   * */
  expect(isRecoveryKeySupported("1.9.0", nanoX)).toBe(false);
  expect(isRecoveryKeySupported("1.9.0-whatever0", nanoX)).toBe(false);

  /**
   * Nano SP
   * */
  expect(isRecoveryKeySupported("2.0.0", nanoSP)).toBe(false);
  expect(isRecoveryKeySupported("2.0.0-whatever0", nanoSP)).toBe(false);

  /**
   * Stax
   * */
  expect(isRecoveryKeySupported("1.9.0", stax)).toBe(true);
  expect(isRecoveryKeySupported("1.9.0-whatever0", stax)).toBe(true);

  expect(isRecoveryKeySupported("1.7.0", stax)).toBe(true);
  expect(isRecoveryKeySupported("1.7.0-whatever0", stax)).toBe(true);

  expect(isRecoveryKeySupported("1.3.0", stax)).toBe(false);
  expect(isRecoveryKeySupported("1.3.0-whatever0", stax)).toBe(false);

  /**
   * Europa
   * */
  expect(isRecoveryKeySupported("1.6.0", europa)).toBe(true);
  expect(isRecoveryKeySupported("1.6.0-whatever0", europa)).toBe(true);

  expect(isRecoveryKeySupported("1.3.0", europa)).toBe(true);
  expect(isRecoveryKeySupported("1.3.0-whatever0", europa)).toBe(true);

  expect(isRecoveryKeySupported("1.2.0", europa)).toBe(false);
  expect(isRecoveryKeySupported("1.2.0-whatever0", europa)).toBe(false);
});
