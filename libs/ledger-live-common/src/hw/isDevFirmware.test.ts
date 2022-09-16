import isDevFirmware from "./isDevFirmware";

describe("isDevFirmware sanity checks", () => {
  const dataSet = {
    "10.10.10.10": false,
    "1.0.0.0": false,
    "1.0.0": false,
    "2.0.2": false,
    "2": false,
    "1.2": false,

    "2-rc1": true,
    "2.0.2-rc1": true,
    "12.0.2-lo": true,
    "23.01.2-il123": true,
    "23.01.2-tr123": true,
  };

  Object.entries(dataSet).forEach(([key, value]) => {
    it(`\t Testing ${key}`, () => {
      expect(isDevFirmware(key)).toBe(value);
    });
  });
});
