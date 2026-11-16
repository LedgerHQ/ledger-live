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
    await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SIGNATURE",
        operation: createFixtureOperation(),
        rawData: {
          unsigned: Buffer.from(new Uint8Array(64).fill(0x42)).toString("base64"),
        },
      },
    });

    expect(executeTransactionBlock).toHaveBeenCalledTimes(1);
    expect(executeTransactionBlock.mock.lastCall[1]).toHaveProperty("signature");
  });

  it("updates the signed operation", async () => {
    const operation = createFixtureOperation();

    const result = await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SIGNATURE",
        operation,
        rawData: {
          unsigned: Buffer.from(new Uint8Array(64).fill(0x42)).toString("base64"),
        },
      },
    });

    expect(result.hash).not.toEqual(operation.hash);
  });

  it("sends the bare serialized signature of a raw signed operation, not the signed payload", async () => {
    const unsigned = Buffer.from(new Uint8Array(64).fill(0x42)).toString("base64");

    const result = await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SENDER_SIGNED_DATA_HEX",
        operation: createFixtureOperation(),
        rawData: { serializedSignature: "BARE_SIGNATURE", unsigned },
      },
    });

    expect(executeTransactionBlock).toHaveBeenCalledWith(expect.anything(), {
      transactionBlock: unsigned,
      signature: "BARE_SIGNATURE",
    });
    expect(result.hash).toBe("test-digest-hash");
  });

  it("falls back to the signature of an operation signed through signOperation", async () => {
    const unsigned = new Uint8Array([1, 2, 3]);

    await broadcast({
      account: { currency: { id: "sui" } } as any,
      signedOperation: {
        signature: "SERIALIZED_SIGNATURE",
        operation: createFixtureOperation(),
        rawData: { unsigned },
      },
    });

    expect(executeTransactionBlock).toHaveBeenCalledWith(expect.anything(), {
      transactionBlock: unsigned,
      signature: "SERIALIZED_SIGNATURE",
    });
  });
});
