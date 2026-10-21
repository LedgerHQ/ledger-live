import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { buildMockServerDeviceId, buildSpeculosDeviceId, parseDeviceId } from "../deviceTarget";

describe("deviceTarget", () => {
  it("parses the transports that need no configuration", () => {
    expect(parseDeviceId("webhid")).toEqual({ kind: "webhid" });
    expect(parseDeviceId("webble")).toEqual({ kind: "webble" });
    expect(parseDeviceId("mockserver")).toEqual({ kind: "mockserver" });
  });

  it("round-trips a mock server device id, with or without a session token to join", () => {
    expect(buildMockServerDeviceId()).toBe("mockserver");
    expect(buildMockServerDeviceId("  ")).toBe("mockserver");

    const deviceId = buildMockServerDeviceId(" abc.def ");

    expect(deviceId).toBe("mockserver|abc.def");
    expect(parseDeviceId(deviceId)).toEqual({ kind: "mockserver", token: "abc.def" });
  });

  it("round-trips a Speculos device id and drops trailing slashes", () => {
    const deviceId = buildSpeculosDeviceId(" http://127.0.0.1:5000/ ", DeviceModelId.NANO_X);

    expect(deviceId).toBe("speculos|nanoX|http://127.0.0.1:5000");
    expect(parseDeviceId(deviceId)).toEqual({
      kind: "speculos",
      model: DeviceModelId.NANO_X,
      url: "http://127.0.0.1:5000",
    });
  });

  it.each([
    "",
    "usb",
    "mockserver|",
    "speculos",
    "speculos|nanoX",
    "speculos|unknown|http://localhost:5000",
  ])("leaves %p to other transport modules", deviceId => {
    expect(parseDeviceId(deviceId)).toBeNull();
  });
});
