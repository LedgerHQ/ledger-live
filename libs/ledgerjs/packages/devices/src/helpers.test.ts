import { DeviceModelId } from ".";
import { stringToDeviceModelId } from "./helpers";

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
