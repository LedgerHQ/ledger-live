import { createKeyRingV1DeviceBridge } from "../v1";
import { createKeyRingClient } from "./keyRingClient";
import { memberKeyRecordOf } from "../internals/handles";

const CONFIG = {
  mock: true,
  instanceName: "Test instance",
  apiBaseUrl: "https://trustchain.test",
  deviceBridge: createKeyRingV1DeviceBridge({
    withDevice: () => () => {
      throw new Error("no device in the mock environment");
    },
    createSessionTransport: () => {
      throw new Error("no device in the mock environment");
    },
  }),
};

describe("createKeyRingClient", () => {
  it("builds the mock environment client from the config", async () => {
    const client = createKeyRingClient(CONFIG);
    const memberKey = memberKeyRecordOf(await client.createMemberKey());
    expect(memberKey.pubkey).toBe("mock-pub-key-Test instance-1");
  });

  it("shares its lifecycle with the clients bound to a device session", () => {
    const client = createKeyRingClient(CONFIG);
    const derived = client.forDeviceSession({ dmk: {} as never, sessionId: "session-1" });

    expect(derived).not.toBe(client);
    expect(derived.lifecycle.onKeyRotation).toBe(client.lifecycle.onKeyRotation);
    expect(derived.lifecycle.subscribe).toBe(client.lifecycle.subscribe);
  });

  it("refuses a device bridge this package did not build", () => {
    expect(() =>
      createKeyRingClient({ ...CONFIG, deviceBridge: { kind: "KeyRingDeviceBridge" } }),
    ).toThrow("Unknown key ring device bridge");
  });
});
