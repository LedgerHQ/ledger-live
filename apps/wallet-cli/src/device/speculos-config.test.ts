import { describe, expect, it } from "bun:test";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { InvalidSpeculosConfigError, readSpeculosConfig } from "./speculos-config";

describe("readSpeculosConfig", () => {
  it("returns null without SPECULOS_API_PORT or SPECULOS_ADDRESS, so USB stays the default", () => {
    expect(readSpeculosConfig({})).toBeNull();
    expect(readSpeculosConfig({ SPECULOS_DEVICE: "nanoSP" })).toBeNull();
    expect(readSpeculosConfig({ SPECULOS_API_PORT: " ", SPECULOS_ADDRESS: "" })).toBeNull();
  });

  it("targets localhost on SPECULOS_API_PORT", () => {
    expect(readSpeculosConfig({ SPECULOS_API_PORT: "40000" })).toEqual({
      url: "http://127.0.0.1:40000",
      deviceModelId: DeviceModelId.STAX,
    });
  });

  it("adds SPECULOS_API_PORT to an address without a port", () => {
    expect(
      readSpeculosConfig({ SPECULOS_ADDRESS: "http://speculos", SPECULOS_API_PORT: "41000" })?.url,
    ).toBe("http://speculos:41000");
  });

  it("defaults to port 5000 when only SPECULOS_ADDRESS is set", () => {
    expect(readSpeculosConfig({ SPECULOS_ADDRESS: "http://speculos" })?.url).toBe(
      "http://speculos:5000",
    );
  });

  it("keeps the port already in SPECULOS_ADDRESS, even the scheme's default one", () => {
    expect(
      readSpeculosConfig({ SPECULOS_ADDRESS: "https://speculos.test:8443", SPECULOS_API_PORT: "1" })
        ?.url,
    ).toBe("https://speculos.test:8443");
    expect(readSpeculosConfig({ SPECULOS_ADDRESS: "http://speculos:80" })?.url).toBe(
      "http://speculos",
    );
  });

  it.each([
    ["nanoS", DeviceModelId.NANO_S],
    ["nanoSP", DeviceModelId.NANO_SP],
    ["nanoX", DeviceModelId.NANO_X],
    ["stax", DeviceModelId.STAX],
    ["flex", DeviceModelId.FLEX],
    ["nanoGen5", DeviceModelId.APEX],
  ])("maps SPECULOS_DEVICE=%s to its DMK model", (device, model) => {
    expect(
      readSpeculosConfig({ SPECULOS_API_PORT: "5000", SPECULOS_DEVICE: device })?.deviceModelId,
    ).toBe(model);
  });

  it.each([
    [{ SPECULOS_API_PORT: "abc" }, /SPECULOS_API_PORT/],
    [{ SPECULOS_API_PORT: "0" }, /SPECULOS_API_PORT/],
    [{ SPECULOS_API_PORT: "70000" }, /SPECULOS_API_PORT/],
    [{ SPECULOS_ADDRESS: "not a url" }, /SPECULOS_ADDRESS/],
    [{ SPECULOS_ADDRESS: "ftp://speculos" }, /http or https/],
    [{ SPECULOS_API_PORT: "5000", SPECULOS_DEVICE: "nanoZ" }, /SPECULOS_DEVICE must be one of/],
  ])("rejects an invalid configuration %o", (env, message) => {
    expect(() => readSpeculosConfig(env)).toThrow(InvalidSpeculosConfigError);
    expect(() => readSpeculosConfig(env)).toThrow(message);
  });

  it.each(["toString", "constructor", "__proto__"])(
    "rejects SPECULOS_DEVICE=%s inherited from Object.prototype",
    device => {
      const env = { SPECULOS_API_PORT: "5000", SPECULOS_DEVICE: device };
      expect(() => readSpeculosConfig(env)).toThrow(InvalidSpeculosConfigError);
      expect(() => readSpeculosConfig(env)).toThrow(/SPECULOS_DEVICE must be one of/);
    },
  );
});
