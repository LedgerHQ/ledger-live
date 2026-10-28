import type { TransportDiscoveredDevice } from "@ledgerhq/device-management-kit";
import { firstValueFrom } from "rxjs";
import { createFakeTransport, makeTransportDevice } from "./__mocks__/fakeTransport";
import { withAvailabilityUntilDisconnect } from "./withAvailabilityUntilDisconnect";

const setup = () => {
  const fake = createFakeTransport();
  const transport = withAvailabilityUntilDisconnect(fake.factory)(fake.args);
  const availableIds = async (): Promise<string[]> =>
    (await firstValueFrom(transport.listenToAvailableDevices())).map(({ id }) => id);
  const discover = async (device: TransportDiscoveredDevice): Promise<void> => {
    const discovered = firstValueFrom(transport.startDiscovering());
    fake.discover(device);
    await discovered;
  };
  return { fake, transport, availableIds, discover };
};

describe("withAvailabilityUntilDisconnect", () => {
  it("GIVEN a discovered device, WHEN listening, THEN it is available", async () => {
    const { availableIds, discover } = setup();

    await discover(makeTransportDevice("device-a"));

    expect(await availableIds()).toEqual(["device-a"]);
  });

  it("GIVEN a device the transport still lists but that was never discovered through the wrapper, WHEN listening, THEN it is not available", async () => {
    const { fake, availableIds } = setup();

    fake.discover(makeTransportDevice("device-a"));

    expect(await availableIds()).toEqual([]);
  });

  it("GIVEN a connected device, WHEN its connection is lost, THEN it leaves the available devices and the caller is notified", async () => {
    const { fake, transport, availableIds, discover } = setup();
    await discover(makeTransportDevice("device-a"));
    await discover(makeTransportDevice("device-b"));
    const onDisconnect = jest.fn();
    await transport.connect({ deviceId: "device-a", onDisconnect });

    fake.loseConnection("device-a");

    expect(onDisconnect).toHaveBeenCalledWith("device-a");
    expect(await availableIds()).toEqual(["device-b"]);
  });

  it("GIVEN a connected device, WHEN it is disconnected, THEN it leaves the available devices", async () => {
    const { transport, availableIds, discover } = setup();
    await discover(makeTransportDevice("device-a"));
    const connected = await transport.connect({ deviceId: "device-a", onDisconnect: jest.fn() });

    await transport.disconnect({ connectedDevice: connected.unsafeCoerce() });

    expect(await availableIds()).toEqual([]);
  });

  it("GIVEN a disconnected device, WHEN it is discovered again, THEN it is available again", async () => {
    const { fake, transport, availableIds, discover } = setup();
    await discover(makeTransportDevice("device-a"));
    await transport.connect({ deviceId: "device-a", onDisconnect: jest.fn() });
    fake.loseConnection("device-a");

    await discover(makeTransportDevice("device-a"));

    expect(await availableIds()).toContain("device-a");
  });

  it("GIVEN connect params, WHEN connecting, THEN they are forwarded to the transport", async () => {
    const { fake, transport, discover } = setup();
    await discover(makeTransportDevice("device-a"));
    const onReconnect = jest.fn();
    const params = { deviceId: "device-a", onDisconnect: jest.fn(), onReconnect };

    await transport.connect(params);

    expect(fake.transport.connect).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: "device-a", onReconnect }),
    );
  });
});
