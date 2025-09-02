import { adaptCoreOperationToLiveOperation, extractBalance } from "./utils";
import BigNumber from "bignumber.js";
import { Operation as CoreOperation } from "@ledgerhq/coin-framework/api/types";

describe("Alpaca utils", () => {
  describe("extractBalance", () => {
    it("extracts an existing balance", () => {
      expect(extractBalance([{ value: 4n, asset: { type: "type1" } }], "type1")).toEqual({
        value: 4n,
        asset: { type: "type1" },
      });
    });

    it("generates an empty balance for a missing type", () => {
      expect(extractBalance([{ value: 4n, asset: { type: "type1" } }], "type2")).toEqual({
        value: 0n,
        asset: { type: "type2" },
      });
    });
  });

  jest.mock("@ledgerhq/coin-framework/operation", () => ({
    encodeOperationId: jest.fn((accountId, txHash, opType) => `${accountId}-${txHash}-${opType}`),
  }));

  describe("adaptCoreOperationToLiveOperation", () => {
    const accountId = "acc_123";
    const baseOp: CoreOperation = {
      id: "op_123",
      asset: { type: "native" },
      type: "OUT",
      value: BigInt(100),
      tx: {
        hash: "txhash123",
        fees: BigInt(10),
        block: {
          hash: "blockhash123",
          height: 123456,
        },
        date: new Date("2025-08-29T12:00:00Z"),
      },
      senders: ["sender1"],
      recipients: ["recipient1"],
    };

    it("adapts a basic OUT operation", () => {
      const result = adaptCoreOperationToLiveOperation(accountId, baseOp);

      expect(result).toEqual({
        id: "acc_123-txhash123-OUT",
        hash: "txhash123",
        accountId,
        type: "OUT",
        value: new BigNumber(110), // value + fee
        fee: new BigNumber(10),
        blockHash: "blockhash123",
        blockHeight: 123456,
        senders: ["sender1"],
        recipients: ["recipient1"],
        date: new Date("2025-08-29T12:00:00Z"),
        transactionSequenceNumber: undefined,
        hasFailed: false,
        extra: {},
      });
    });

    it("handles FEES operation where value = value + fees", () => {
      const op = {
        ...baseOp,
        type: "FEES",
        value: BigInt(5),
        tx: { ...baseOp.tx, fees: BigInt(2) },
      };

      const result = adaptCoreOperationToLiveOperation(accountId, op);

      expect(result.value.toString()).toEqual("7");
    });

    it("handles non-FEES/OUT operation where value = value only", () => {
      const op = {
        ...baseOp,
        type: "IN",
        value: BigInt(50),
        tx: { ...baseOp.tx, fees: BigInt(2) },
      };

      const result = adaptCoreOperationToLiveOperation(accountId, op);

      expect(result.value.toString()).toEqual("50");
    });
  });
});
