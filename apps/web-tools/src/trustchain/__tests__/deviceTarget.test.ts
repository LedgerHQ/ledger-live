import { buildMockServerDeviceId, parseDeviceId } from "../deviceTarget";

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

  it.each(["", "usb", "mockserver|", "speculos", "speculos|nanoX|http://127.0.0.1:5000"])(
    "leaves %p to other transport modules",
    deviceId => {
      expect(parseDeviceId(deviceId)).toBeNull();
    },
  );
});
