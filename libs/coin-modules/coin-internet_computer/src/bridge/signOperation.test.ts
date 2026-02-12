import BigNumber from "bignumber.js";
import { buildSignOperation } from "./signOperation";

jest.mock("../dfinity/hash", () => ({
  hashTransaction: jest.fn().mockReturnValue("mocked-tx-hash"),
}));

jest.mock("../dfinity/public-key", () => ({
  pubkeyToDer: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

jest.mock("../dfinity/transfer", () => ({
  createUnsignedSendTransaction: jest.fn().mockReturnValue({
    unsignedTransaction: { request_type: "call" },
    transferRawRequest: {
      amount: { e8s: BigInt(50000) },
      fee: { e8s: BigInt(10000) },
      memo: BigInt(12345),
      created_at_time: [{ timestamp_nanos: BigInt(1700000000000000000) }],
    },
  }),
  Cbor: {
    encode: jest.fn().mockReturnValue(new Uint8Array([10, 20, 30])),
  },
}));

describe("buildSignOperation", () => {
  it("should emit device-signature-requested, device-signature-granted, and signed events", done => {
    const mockSignerContext = jest.fn().mockImplementation((_deviceId: string, fn: any) =>
      fn({
        sign: jest.fn().mockResolvedValue({
          signatureRS: Buffer.from("fake-signature"),
        }),
      }),
    );

    const signOperation = buildSignOperation(mockSignerContext as any);

    const account = {
      id: "js:2:internet_computer:test-pubkey:",
      xpub: "test-pubkey",
      freshAddress: "sender-address",
      freshAddressPath: "44'/223'/0'/0/0",
    } as any;

    const transaction = {
      recipient: "recipient-address",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
      memo: "12345",
    } as any;

    const events: any[] = [];
    signOperation({ account, transaction, deviceId: "device-1" }).subscribe({
      next: event => events.push(event),
      complete: () => {
        expect(events).toHaveLength(3);
        expect(events[0].type).toBe("device-signature-requested");
        expect(events[1].type).toBe("device-signature-granted");
        expect(events[2].type).toBe("signed");
        expect(events[2].signedOperation.operation).toBeDefined();
        expect(events[2].signedOperation.signature).toBeDefined();
        expect(events[2].signedOperation.rawData.encodedSignedCallBlob).toBeDefined();
        done();
      },
      error: done,
    });
  });

  it("should throw when account has no xpub", done => {
    const mockSignerContext = jest.fn();

    const signOperation = buildSignOperation(mockSignerContext as any);

    const account = {
      id: "js:2:internet_computer::",
      xpub: "",
      freshAddress: "sender",
      freshAddressPath: "44'/223'/0'/0/0",
    } as any;

    const transaction = {
      recipient: "recipient",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
    } as any;

    signOperation({ account, transaction, deviceId: "device-1" }).subscribe({
      next: () => {},
      error: err => {
        expect(err).toBeDefined();
        done();
      },
      complete: () => done(new Error("should have errored")),
    });
  });

  it("should handle transaction without memo", done => {
    const mockSignerContext = jest.fn().mockImplementation((_deviceId: string, fn: any) =>
      fn({
        sign: jest.fn().mockResolvedValue({
          signatureRS: Buffer.from("fake-signature"),
        }),
      }),
    );

    const signOperation = buildSignOperation(mockSignerContext as any);

    const account = {
      id: "js:2:internet_computer:test-pubkey:",
      xpub: "test-pubkey",
      freshAddress: "sender-address",
      freshAddressPath: "44'/223'/0'/0/0",
    } as any;

    const transaction = {
      recipient: "recipient-address",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
    } as any;

    const events: any[] = [];
    signOperation({ account, transaction, deviceId: "device-1" }).subscribe({
      next: event => events.push(event),
      complete: () => {
        expect(events).toHaveLength(3);
        done();
      },
      error: done,
    });
  });
});
