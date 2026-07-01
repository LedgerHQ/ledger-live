import { describe, expect, it } from "bun:test";
import { WalletCliDmkTransport } from "./wallet-cli-dmk-transport";

type SendApduArgs = {
  sessionId: string;
  apdu: Uint8Array;
  abortTimeout?: number;
};

function makeDmk(onSendApdu: (args: SendApduArgs) => { data: Uint8Array; statusCode: Uint8Array }) {
  return {
    sendApdu: async (args: SendApduArgs) => onSendApdu(args),
  };
}

describe("WalletCliDmkTransport.exchange", () => {
  it("forwards the APDU to dmk.sendApdu and concatenates data + statusCode into one Buffer", async () => {
    let captured: SendApduArgs | undefined;
    const dmk = makeDmk(args => {
      captured = args;
      return { data: new Uint8Array([0x01, 0x02, 0x03]), statusCode: new Uint8Array([0x90, 0x00]) };
    });

    const transport = new WalletCliDmkTransport(dmk as never, "session-xyz");
    const response = await transport.exchange(Buffer.from([0xe0, 0x01, 0x00, 0x00]));

    expect([...response]).toEqual([0x01, 0x02, 0x03, 0x90, 0x00]);
    expect(captured?.sessionId).toBe("session-xyz");
    expect([...(captured?.apdu ?? new Uint8Array())]).toEqual([0xe0, 0x01, 0x00, 0x00]);
  });

  it("applies the default abort timeout when the caller does not provide one", async () => {
    let abortTimeout: number | undefined;
    const dmk = makeDmk(args => {
      abortTimeout = args.abortTimeout;
      return { data: new Uint8Array(), statusCode: new Uint8Array([0x90, 0x00]) };
    });

    await new WalletCliDmkTransport(dmk as never, "s").exchange(Buffer.from([0xb0, 0x01]));

    expect(abortTimeout).toBe(120_000);
  });

  it("passes a caller-provided abort timeout through to dmk.sendApdu", async () => {
    let abortTimeout: number | undefined;
    const dmk = makeDmk(args => {
      abortTimeout = args.abortTimeout;
      return { data: new Uint8Array(), statusCode: new Uint8Array([0x90, 0x00]) };
    });

    await new WalletCliDmkTransport(dmk as never, "s").exchange(Buffer.from([0xb0, 0x01]), {
      abortTimeoutMs: 5_000,
    });

    expect(abortTimeout).toBe(5_000);
  });
});
