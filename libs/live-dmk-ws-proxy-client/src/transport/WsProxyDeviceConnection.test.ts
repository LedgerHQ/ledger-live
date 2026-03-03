import { WsProxyDeviceConnection } from "./WsProxyDeviceConnection";

const makeConnection = () =>
  new WsProxyDeviceConnection("device-1", {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  } as unknown as WebSocket);

describe("WsProxyDeviceConnection", () => {
  it("rejects concurrent pending connect requests", () => {
    const connection = makeConnection();

    connection.addPendingConnect("req-1", { resolve: jest.fn(), reject: jest.fn() });

    expect(() =>
      connection.addPendingConnect("req-2", { resolve: jest.fn(), reject: jest.fn() }),
    ).toThrow("Concurrent connect request is not supported");
  });

  it("rejects concurrent pending APDU requests", () => {
    const connection = makeConnection();

    connection.addPendingApdu("req-1", { resolve: jest.fn(), reject: jest.fn() });

    expect(() =>
      connection.addPendingApdu("req-2", { resolve: jest.fn(), reject: jest.fn() }),
    ).toThrow("Concurrent APDU request is not supported");
  });

  it("resolves pending connect requests by requestId", () => {
    const connection = makeConnection();
    const resolve = jest.fn();

    connection.addPendingConnect("req-1", { resolve, reject: jest.fn() });

    expect(
      connection.resolveConnect("req-1", {
        sessionId: "session-1",
        deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
      }),
    ).toBe(true);
    expect(resolve).toHaveBeenCalledWith({
      sessionId: "session-1",
      deviceModel: { id: "nanoX", productName: "Ledger Nano X" },
    });
  });

  it("rejects pending connect or APDU requests by requestId", () => {
    const connection = makeConnection();
    const rejectConnect = jest.fn();
    const rejectApdu = jest.fn();

    connection.addPendingConnect("req-connect", {
      resolve: jest.fn(),
      reject: rejectConnect,
    });
    connection.addPendingApdu("req-apdu", {
      resolve: jest.fn(),
      reject: rejectApdu,
    });

    expect(connection.rejectPendingRequest("req-connect", new Error("connect failed"))).toBe(true);
    expect(connection.rejectPendingRequest("req-apdu", new Error("apdu failed"))).toBe(true);
    expect(rejectConnect).toHaveBeenCalledWith(new Error("connect failed"));
    expect(rejectApdu).toHaveBeenCalledWith(new Error("apdu failed"));
  });

  it("rejects all pending requests", () => {
    const connection = makeConnection();
    const rejectConnect = jest.fn();
    const rejectApdu = jest.fn();

    connection.addPendingConnect("req-connect", {
      resolve: jest.fn(),
      reject: rejectConnect,
    });
    connection.addPendingApdu("req-apdu", {
      resolve: jest.fn(),
      reject: rejectApdu,
    });

    connection.rejectAllPending(new Error("socket closed"));

    expect(rejectConnect).toHaveBeenCalledWith(new Error("socket closed"));
    expect(rejectApdu).toHaveBeenCalledWith(new Error("socket closed"));
  });

  it("emits disconnect callback when set", () => {
    const connection = makeConnection();
    const onDisconnect = jest.fn();
    connection.setOnDisconnect(onDisconnect);

    connection.emitDisconnect();

    expect(onDisconnect).toHaveBeenCalledWith("device-1");
  });
});
