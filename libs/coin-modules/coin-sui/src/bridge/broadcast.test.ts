import { createFixtureOperation } from "../types/bridge.fixture";
import coinConfig from "../config";
import { broadcast } from "./broadcast";

const SUCCESS = { digest: "test-digest-hash", effects: { status: { status: "success" } } };
const executeTransactionBlock = jest.fn().mockResolvedValue(SUCCESS);

jest.mock("../network", () => {
  return {
    executeTransactionBlock: (config: any, arg: any) => executeTransactionBlock(config, arg),
  };
});

describe("broadcast", () => {
  beforeEach(() => {
    executeTransactionBlock.mockClear();
    coinConfig.setCoinConfig(() => ({}) as never);
    executeTransactionBlock.mockResolvedValue(SUCCESS);
  });

  it("calls explorer for broadcast operation", async () => {
    // WHEN
    await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SIGNATURE",
        operation: createFixtureOperation(),
        rawData: {
          serializedSignature: new Uint8Array(64).fill(0x42),
          unsigned: Buffer.from(new Uint8Array(64).fill(0x42)).toString("base64"),
        },
      },
    });

    // THEN
    expect(executeTransactionBlock).toHaveBeenCalledTimes(1);
    expect(executeTransactionBlock.mock.lastCall[1]).toHaveProperty("signature");
  });

  it("updates the signed operation", async () => {
    // GIVEN
    const operation = createFixtureOperation();

    // WHEN
    const result = await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SIGNATURE",
        operation,
        rawData: {
          serializedSignature: new Uint8Array(64).fill(0x42),
          unsigned: Buffer.from(new Uint8Array(64).fill(0x42)).toString("base64"),
        },
      },
    });

    // THEN
    expect(result.hash).not.toEqual(operation.hash);
  });

  it("sends the bare serialized signature of a raw signed operation, not the signed payload", async () => {
    // GIVEN a raw operation: `signature` carries the serialized signed transaction for the caller
    const unsigned = Buffer.from(new Uint8Array(64).fill(0x42)).toString("base64");

    // WHEN
    const result = await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SENDER_SIGNED_DATA_HEX",
        operation: createFixtureOperation(),
        rawData: { serializedSignature: "BARE_SIGNATURE", unsigned },
      },
    });

    // THEN
    expect(executeTransactionBlock).toHaveBeenCalledWith(expect.anything(), {
      transactionBlock: unsigned,
      signature: "BARE_SIGNATURE",
    });
    expect(result.hash).toBe("test-digest-hash");
  });

  it("falls back to the signature of an operation signed through signOperation", async () => {
    // GIVEN no serializedSignature in rawData
    const unsigned = new Uint8Array([1, 2, 3]);

    // WHEN
    await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SERIALIZED_SIGNATURE",
        operation: createFixtureOperation(),
        rawData: { unsigned },
      },
    });

    // THEN
    expect(executeTransactionBlock).toHaveBeenCalledWith(expect.anything(), {
      transactionBlock: unsigned,
      signature: "SERIALIZED_SIGNATURE",
    });
  });
});
