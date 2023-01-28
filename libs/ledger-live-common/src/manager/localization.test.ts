import { DeviceModelId } from "@ledgerhq/devices";
import { isDeviceLocalizationSupported } from "./localization";
const { nanoS, nanoSP, nanoX, stax } = DeviceModelId;

test("isDeviceLocalizationSupported", () => {
  /**
   * Nano X
   * */
  expect(isDeviceLocalizationSupported("2.0.0", nanoX)).toBe(false);
  expect(isDeviceLocalizationSupported("2.0.0-whatever0", nanoX)).toBe(false);

  expect(isDeviceLocalizationSupported("2.1.0", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("2.1.0-rc1", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("2.1.1", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("2.1.1-whatever0", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("2.2.0", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("2.2.0-whatever0", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("3.0.0", nanoX)).toBe(true);
  expect(isDeviceLocalizationSupported("3.0.0-whatever0", nanoX)).toBe(true);

  /**
   * Nano SP
   * */
  expect(isDeviceLocalizationSupported("1.0.0", nanoSP)).toBe(false);
  expect(isDeviceLocalizationSupported("1.0.0-whatever", nanoSP)).toBe(false);

  expect(isDeviceLocalizationSupported("1.1.0", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("1.1.0-rc1", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("1.1.2", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("1.1.2-whatever0", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("1.2.0", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("1.2.0-whatever0", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("2.0.0", nanoSP)).toBe(true);
  expect(isDeviceLocalizationSupported("2.0.0-whatever0", nanoSP)).toBe(true);

  /**
   * Stax
   * */
  expect(isDeviceLocalizationSupported("9.0.0", stax)).toBe(false);
  expect(isDeviceLocalizationSupported("9.0.0-whatever", stax)).toBe(false);

  /**
   * NanoS
   * */
  expect(isDeviceLocalizationSupported("9.0.0", nanoS)).toBe(false);
  expect(isDeviceLocalizationSupported("9.0.0-whatever", nanoS)).toBe(false);
});
