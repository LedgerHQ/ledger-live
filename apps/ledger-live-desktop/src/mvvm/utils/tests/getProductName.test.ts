import { DeviceModelId } from "@ledgerhq/types-devices";
import { getProductName } from "../getProductName";

describe("getProductName", () => {
  it("should return the product name for a known model ID #NanoX", () => {
    const modelId = DeviceModelId.nanoX;
    const productName = getProductName(modelId);
    expect(productName).toBe("Nano\u00A0X");
  });

  it("should return the product name for a known model ID #NanoS", () => {
    const modelId = DeviceModelId.nanoS;
    const productName = getProductName(modelId);
    expect(productName).toBe("Nano\u00A0S");
  });

  it("should return the product name for a known model ID#Stax", () => {
    const modelId = DeviceModelId.stax;
    const productName = getProductName(modelId);
    expect(productName).toBe("Stax");
  });

  it("should return the product name for a known model ID#Flex", () => {
    const modelId = DeviceModelId.europa;
    const productName = getProductName(modelId);
    expect(productName).toBe("Flex");
  });

  it("should return the product name for a known model ID #NanoSP", () => {
    const modelId = DeviceModelId.nanoSP;
    const productName = getProductName(modelId);
    expect(productName).toBe("Nano\u0020S\u0020Plus");
  });
});
