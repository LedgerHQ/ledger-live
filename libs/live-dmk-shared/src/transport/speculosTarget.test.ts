import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { readSpeculosTarget } from "./speculosTarget";

describe("readSpeculosTarget", () => {
  it("returns null without SPECULOS_API_PORT", () => {
    expect(readSpeculosTarget({})).toBeNull();
    expect(readSpeculosTarget({ SPECULOS_ADDRESS: "http://speculos:5000" })).toBeNull();
  });

  it("defaults to a local Nano S Plus", () => {
    const local = { url: "http://127.0.0.1:40000", deviceModelId: DeviceModelId.NANO_SP };

    expect(readSpeculosTarget({ SPECULOS_API_PORT: "40000" })).toEqual(local);
    expect(readSpeculosTarget({ SPECULOS_API_PORT: "40000", SPECULOS_ADDRESS: "" })).toEqual(local);
  });

  it("carries the token of a protected Speculinho session", () => {
    expect(
      readSpeculosTarget({ SPECULOS_API_PORT: "40000", SPECULOS_SESSION_TOKEN: "secret" })
        ?.bearerToken,
    ).toBe("secret");
  });

  it("appends the port unless the address already carries one", () => {
    expect(
      readSpeculosTarget({ SPECULOS_API_PORT: "40000", SPECULOS_ADDRESS: "http://speculos/" })?.url,
    ).toBe("http://speculos:40000");
    expect(
      readSpeculosTarget({ SPECULOS_API_PORT: "40000", SPECULOS_ADDRESS: "http://speculos:5000" })
        ?.url,
    ).toBe("http://speculos:5000");
  });

  it.each([
    ["nanoS", DeviceModelId.NANO_S],
    ["nanoX", DeviceModelId.NANO_X],
    ["stax", DeviceModelId.STAX],
    ["flex", DeviceModelId.FLEX],
    ["europa", DeviceModelId.FLEX],
    ["nanoGen5", DeviceModelId.APEX],
    ["unknown", DeviceModelId.NANO_SP],
    ["constructor", DeviceModelId.NANO_SP],
  ])("maps SPECULOS_DEVICE=%s to its model", (device, model) => {
    expect(
      readSpeculosTarget({ SPECULOS_API_PORT: "40000", SPECULOS_DEVICE: device })?.deviceModelId,
    ).toBe(model);
  });
});
