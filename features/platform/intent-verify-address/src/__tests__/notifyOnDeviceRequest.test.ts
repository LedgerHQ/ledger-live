import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { notifyOnDeviceRequest } from "../notifyOnDeviceRequest";

class FakeDmk {
  readonly sessionId = "session-1";
  readonly sendApdu = jest.fn(async () => ({
    data: new Uint8Array(),
    statusCode: new Uint8Array(),
  }));
  readonly sendCommand = jest.fn(async () => ({ status: "SUCCESS" }));
  readonly executeDeviceAction = jest.fn(() => ({ observable: "device-action" }));

  getConnectedDevice() {
    return { sessionId: this.sessionId };
  }
}

function setup() {
  const fakeDmk = new FakeDmk();
  const onDeviceRequest = jest.fn();
  const dmk = notifyOnDeviceRequest(fakeDmk as unknown as DeviceManagementKit, onDeviceRequest);

  return { fakeDmk, dmk, onDeviceRequest };
}

describe("notifyOnDeviceRequest", () => {
  it("notifies when an APDU is sent, then forwards it to the device", async () => {
    const { dmk, fakeDmk, onDeviceRequest } = setup();
    const args = { sessionId: "session-1", apdu: new Uint8Array([0xe0]) };

    await expect(dmk.sendApdu(args)).resolves.toEqual({
      data: new Uint8Array(),
      statusCode: new Uint8Array(),
    });
    expect(onDeviceRequest).toHaveBeenCalledTimes(1);
    expect(fakeDmk.sendApdu).toHaveBeenCalledWith(args);
  });

  it.each(["sendCommand", "executeDeviceAction"] as const)(
    "notifies when a DMK signer calls %s",
    method => {
      const { dmk, fakeDmk, onDeviceRequest } = setup();

      (dmk[method] as (args: unknown) => unknown)({ sessionId: "session-1" });

      expect(onDeviceRequest).toHaveBeenCalledTimes(1);
      expect(fakeDmk[method]).toHaveBeenCalledWith({ sessionId: "session-1" });
    },
  );

  it("forwards other calls without notifying, keeping the original dmk as this", () => {
    const { dmk, onDeviceRequest } = setup();

    expect(dmk.getConnectedDevice({ sessionId: "session-1" })).toEqual({ sessionId: "session-1" });
    expect(onDeviceRequest).not.toHaveBeenCalled();
  });
});
