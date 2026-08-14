import { createRetrieveConnectedDevicesProtocol } from ".";
import type { Device } from ".";

describe("createRetrieveConnectedDevicesProtocol", () => {
  function setup() {
    const setDevices = jest.fn();
    const protocol = createRetrieveConnectedDevicesProtocol({ setDevices });
    const env = {} as never;
    return { protocol, setDevices, env };
  }

  const validDevices: Device[] = [
    { id: "abc-123", name: "lld IOS" },
    { id: "def-456", name: "llm linux" },
  ];

  it("should call setDevices with the parsed list when a valid devices message is received", () => {
    const { protocol, setDevices, env } = setup();
    protocol.onReceive("RetrieveConnectedDevicesMessages:devices", validDevices, env);
    expect(setDevices).toHaveBeenCalledWith(validDevices);
  });

  it("should call setDevices with an empty list when an empty array is received", () => {
    const { protocol, setDevices, env } = setup();
    protocol.onReceive("RetrieveConnectedDevicesMessages:devices", [], env);
    expect(setDevices).toHaveBeenCalledWith([]);
  });

  it("should not call setDevices when a device is missing the name field", () => {
    const { protocol, setDevices, env } = setup();
    protocol.onReceive(
      "RetrieveConnectedDevicesMessages:devices",
      [{ id: "abc-123" }] as unknown as Device[],
      env,
    );
    expect(setDevices).not.toHaveBeenCalled();
  });

  it("should not call setDevices when a device has a non-string id", () => {
    const { protocol, setDevices, env } = setup();
    protocol.onReceive(
      "RetrieveConnectedDevicesMessages:devices",
      [{ id: 42, name: "Nano" }] as unknown as Device[],
      env,
    );
    expect(setDevices).not.toHaveBeenCalled();
  });

  it("should not call setDevices when the payload is not an array", () => {
    const { protocol, setDevices, env } = setup();
    protocol.onReceive(
      "RetrieveConnectedDevicesMessages:devices",
      { id: "abc", name: "Nano" } as unknown as Device[],
      env,
    );
    expect(setDevices).not.toHaveBeenCalled();
  });
});
