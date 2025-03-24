import { createFixtureOperation } from "../types/bridge.fixture";
import { broadcast } from "./broadcast";

const executeTransactionBlock = jest.fn();

jest.mock("../network", () => {
  return {
    executeTransactionBlock: (arg: any) => executeTransactionBlock(arg),
  };
});

describe("broadcast", () => {
  it("calls explorer for broadcast operation", async () => {
    // WHEN
    await broadcast({
      account: {} as any,
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
    expect(executeTransactionBlock.mock.lastCall[0]).toHaveProperty("signature");
  });

  it("updates the signed operation", async () => {
    // GIVEN
    const operation = createFixtureOperation();

    // WHEN
    const result = await broadcast({
      account: {} as any,
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
});
