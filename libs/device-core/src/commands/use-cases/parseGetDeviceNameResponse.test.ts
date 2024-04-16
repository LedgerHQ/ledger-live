import { parseGetDeviceNameResponse } from "./parseGetDeviceNameResponse";

describe("getDeviceName", () => {
  it("should return name if available", () => {
    const responseBuffer = Buffer.from("50756572746f9000", "hex");

    const result = parseGetDeviceNameResponse(responseBuffer);

    expect(result).toMatch("Puerto"); // 🐾
  });

  it("should return empty name when the device is not onboarded", () => {
    const responseBuffer = Buffer.from("bababababababa6d07", "hex");

    const result = parseGetDeviceNameResponse(responseBuffer);

    expect(result).toMatch("");
  });

  it("should return empty name when the device is not onboarded #2", () => {
    const responseBuffer = Buffer.from("bababababababa6611", "hex");

    const result = parseGetDeviceNameResponse(responseBuffer);

    expect(result).toMatch("");
  });

  it("should throw for an unexpected bootloader or any other code", () => {
    const responseBuffer = Buffer.from("662d", "hex");

    expect(() => {
      parseGetDeviceNameResponse(responseBuffer);
    }).toThrow(Error);
  });
});
