import { DeviceModelId } from ".";
import { stringToDeviceModelId, isDeviceModelId } from "./helpers";

const validDeviceModelsIds = ["nanoS", "nanoX", "blue", "nanoSP", "stax", "europa"];
const invalidDeviceModelsIds = ["does-not-exist", "", null, undefined];

describe("isDeviceModelId", () => {
  validDeviceModelsIds.forEach(potentialModelId => {
    test(`Input: ${potentialModelId} -> Expected output: true`, () => {
      const result = isDeviceModelId(potentialModelId);
      expect(result).toEqual(true);
    });
  });

  invalidDeviceModelsIds.forEach(potentialModelId => {
    test(`Input: ${potentialModelId} -> Expected output: false`, () => {
      const result = isDeviceModelId(potentialModelId);
      expect(result).toEqual(false);
    });
  });
});

type Test = {
  input: [string, DeviceModelId];
  expectedOutput: DeviceModelId;
};

describe("stringToDeviceModelId", () => {
  const tests: Test[] = [
    {
      input: ["stax", DeviceModelId.nanoSP],
      expectedOutput: DeviceModelId.stax,
    },
    {
      input: ["does-not-exist", DeviceModelId.nanoSP],
      expectedOutput: DeviceModelId.nanoSP,
    },
  ];

  tests.forEach(({ input, expectedOutput }) => {
    test(`Input: ${JSON.stringify(input)} -> Expected output: ${expectedOutput}`, () => {
      const result = stringToDeviceModelId(...input);
      expect(result).toEqual(expectedOutput);
    });
  });
});
