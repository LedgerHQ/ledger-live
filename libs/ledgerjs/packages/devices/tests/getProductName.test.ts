import { DeviceModelId, getProductName } from "../src";

describe("getProductName", () => {
  it.each([
    [DeviceModelId.blue, "Ledger\u00A0Blue"],
    [DeviceModelId.nanoS, "Ledger\u00A0Nano\u00A0S"],
    [DeviceModelId.nanoX, "Ledger\u00A0Nano\u00A0X"],
    [DeviceModelId.nanoSP, "Ledger Nano S Plus"],
    [DeviceModelId.stax, "Ledger\u00A0Stax"],
    [DeviceModelId.europa, "Ledger\u00A0Flex"],
    [DeviceModelId.apex, "Ledger\u00A0Nano\u00A0Gen5"],
  ])("should return the canonical product name for %s", (modelId, expectedProductName) => {
    expect(getProductName(modelId)).toBe(expectedProductName);
  });

  it("should throw for an unknown device model", () => {
    expect(() => getProductName("does-not-exist" as DeviceModelId)).toThrow(
      "device 'does-not-exist' does not exist",
    );
  });
});
