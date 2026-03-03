import {
  createConnectMessage,
  createDisconnectMessage,
  createSendApduMessage,
  parseServerMessage,
} from "./messaging";

describe("messaging helpers", () => {
  it("creates connect, disconnect and send-apdu messages", () => {
    expect(createConnectMessage("device-1", "req-1")).toEqual({
      type: "connect",
      deviceId: "device-1",
      requestId: "req-1",
    });
    expect(createDisconnectMessage("device-1", "req-2")).toEqual({
      type: "disconnect",
      deviceId: "device-1",
      requestId: "req-2",
    });
    expect(createSendApduMessage("device-1", "req-3", "e001")).toEqual({
      type: "send-apdu",
      deviceId: "device-1",
      requestId: "req-3",
      data: "e001",
    });
  });

  it("parses server messages from JSON strings", () => {
    const message = parseServerMessage(
      JSON.stringify({
        type: "error",
        requestId: "req-1",
        deviceId: "device-1",
        message: "boom",
      }),
    );

    expect(message).toEqual({
      type: "error",
      requestId: "req-1",
      deviceId: "device-1",
      message: "boom",
    });
  });

  it("parses server messages from values exposing toString()", () => {
    const message = parseServerMessage({
      toString: () =>
        JSON.stringify({
          type: "device-disconnected",
          deviceId: "device-1",
        }),
    });

    expect(message).toEqual({
      type: "device-disconnected",
      deviceId: "device-1",
    });
  });

  it("returns null when payload is not valid JSON", () => {
    expect(parseServerMessage("{not-json")).toBeNull();
  });
});
