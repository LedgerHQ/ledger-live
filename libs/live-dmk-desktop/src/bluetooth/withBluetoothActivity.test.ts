import { GeneralDmkError } from "@ledgerhq/device-management-kit";
import { Left } from "purify-ts";
import { createFakeTransport, makeTransportDevice } from "./__mocks__/fakeTransport";
import { getBluetoothActivity } from "./bluetoothActivity";
import { withBluetoothActivity } from "./withBluetoothActivity";

const connectDevice = async () => {
  const fake = createFakeTransport();
  const transport = withBluetoothActivity(fake.factory)(fake.args);
  fake.discover(makeTransportDevice("device-a"));
  const onDisconnect = jest.fn();
  const connected = (
    await transport.connect({ deviceId: "device-a", onDisconnect })
  ).unsafeCoerce();
  return { fake, transport, connected, onDisconnect };
};

describe("withBluetoothActivity", () => {
  it("GIVEN a connection, WHEN it succeeds, THEN the device is recorded as connected", async () => {
    await connectDevice();

    expect(getBluetoothActivity()).toMatchObject({ deviceName: "device-a", isConnected: true });
  });

  it("GIVEN connect params, WHEN connecting, THEN they are all forwarded to the transport", async () => {
    const fake = createFakeTransport();
    const transport = withBluetoothActivity(fake.factory)(fake.args);
    fake.discover(makeTransportDevice("device-a"));
    const onReconnect = jest.fn();
    const params = { deviceId: "device-a", onDisconnect: jest.fn(), onReconnect };

    await transport.connect(params);

    expect(fake.transport.connect).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: "device-a", onReconnect }),
    );
  });

  it("GIVEN a connected device, WHEN its connection is lost, THEN it is recorded and the caller is notified", async () => {
    const { fake, onDisconnect } = await connectDevice();

    fake.loseConnection("device-a");

    expect(getBluetoothActivity().isConnected).toBe(false);
    expect(onDisconnect).toHaveBeenCalledWith("device-a");
  });

  it("GIVEN a connected device, WHEN the disconnection succeeds, THEN it is recorded as disconnected", async () => {
    const { transport, connected } = await connectDevice();

    await transport.disconnect({ connectedDevice: connected });

    expect(getBluetoothActivity().isConnected).toBe(false);
  });

  it("GIVEN a connected device, WHEN the disconnection fails, THEN it stays recorded as connected", async () => {
    const { fake, transport, connected } = await connectDevice();
    jest.mocked(fake.transport.disconnect).mockResolvedValueOnce(Left(new GeneralDmkError()));

    const result = await transport.disconnect({ connectedDevice: connected });

    expect(result.isLeft()).toBe(true);
    expect(getBluetoothActivity().isConnected).toBe(true);
  });

  it("GIVEN a connected device, WHEN an APDU is exchanged, THEN the exchange is recorded", async () => {
    const { connected } = await connectDevice();
    const before = getBluetoothActivity();

    await connected.sendApdu(new Uint8Array([0xe0, 0x01, 0x00, 0x00]));

    expect(getBluetoothActivity()).toMatchObject({
      apdusSent: before.apdusSent + 1,
      responsesReceived: before.responsesReceived + 1,
      lastStatusWord: "9000",
      lastError: null,
    });
  });
});
