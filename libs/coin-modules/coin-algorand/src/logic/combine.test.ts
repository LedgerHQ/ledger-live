import * as v8 from "v8";
import { combine } from "./combine";

const mockDecodedTxn = { amt: 1000000, fee: 1000, type: "pay" };

jest.mock("algosdk", () => {
  class SignedTransaction {
    sig: Uint8Array | undefined;
    txn: unknown;
    constructor({ sig, txn }: { sig?: Uint8Array; txn: unknown }) {
      this.sig = sig;
      this.txn = txn;
    }
    toEncodingData() {
      return new Map<string, unknown>([
        ["sig", this.sig],
        ["txn", this.txn],
      ]);
    }
    getEncodingSchema() {
      return {};
    }
  }
  return {
    decodeUnsignedTransaction: jest.fn(() => mockDecodedTxn),
    encodeMsgpack: jest.fn((obj: unknown) => v8.serialize(obj)),
    SignedTransaction,
  };
});

describe("combine", () => {
  it("should produce a valid hex-encoded signed transaction", () => {
    const unsignedTx = Buffer.from("raw-msgpack-bytes").toString("hex");
    const sigBytes = Buffer.alloc(80, 0xab);
    const signature = sigBytes.toString("hex");

    const result = combine(unsignedTx, signature);

    expect(result).toMatch(/^[a-f0-9]+$/i);

    const decoded = v8.deserialize(Buffer.from(result, "hex")) as MockSignedTransaction;

    expect(decoded.txn).toEqual(mockDecodedTxn);
    expect(decoded.sig).toHaveLength(64);
    expect(Buffer.from(decoded.sig!).every(b => b === 0xab)).toBe(true);
  });

  it("should truncate signature to 64 bytes", () => {
    const unsignedTx = Buffer.from("some-tx-data").toString("hex");
    const longSig = Buffer.alloc(128, 0xff).toString("hex");

    const result = combine(unsignedTx, longSig);

    const decoded = v8.deserialize(Buffer.from(result, "hex")) as MockSignedTransaction;

    expect(decoded.sig).toHaveLength(64);
  });

  it("should pass decoded transaction to SignedTransaction", () => {
    const unsignedTx = Buffer.from("tx-bytes").toString("hex");
    const signature = Buffer.alloc(64, 0x01).toString("hex");

    const result = combine(unsignedTx, signature);

    const decoded = v8.deserialize(Buffer.from(result, "hex")) as MockSignedTransaction;

    expect(decoded.txn).toEqual(mockDecodedTxn);
    expect(decoded.sig).toHaveLength(64);
  });
});
