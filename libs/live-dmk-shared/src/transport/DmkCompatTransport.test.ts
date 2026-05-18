import { DmkCompatTransport } from "./DmkCompatTransport";

describe("DmkCompatTransport", () => {
  it("forwards APDUs through dmk.sendApdu", async () => {
    const dmk = {
      sendApdu: jest.fn().mockResolvedValue({
        data: Uint8Array.from([0x01, 0x02]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      }),
    } as any;

    const transport = new DmkCompatTransport(dmk, "session-1");

    await expect(
      transport.exchange(Buffer.from([0xaa, 0xbb]), {
        abortTimeoutMs: 1234,
      }),
    ).resolves.toEqual(Buffer.from([0x01, 0x02, 0x90, 0x00]));

    expect(dmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-1",
      apdu: new Uint8Array([0xaa, 0xbb]),
      abortTimeout: 1234,
    });
  });

  it("forwards an undefined abort timeout when none is provided", async () => {
    const dmk = {
      sendApdu: jest.fn().mockResolvedValue({
        data: Uint8Array.from([]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      }),
    } as any;

    const transport = new DmkCompatTransport(dmk, "session-2");

    await transport.exchange(Buffer.from([0xcc]));

    expect(dmk.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-2",
      apdu: new Uint8Array([0xcc]),
      abortTimeout: undefined,
    });
  });

  it("closes without affecting the existing session", async () => {
    const transport = new DmkCompatTransport({ sendApdu: jest.fn() } as any, "session-3");

    await expect(transport.close()).resolves.toBeUndefined();
  });
});
