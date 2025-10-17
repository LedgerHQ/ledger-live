import {
  adaptCoreOperationToLiveOperation,
  extractBalance,
  findCryptoCurrencyByNetwork,
  transactionToIntent,
} from "./utils";
import BigNumber from "bignumber.js";
import { Operation as CoreOperation } from "@ledgerhq/coin-framework/api/types";
import { Account } from "@ledgerhq/types-live";
import { GenericTransaction } from "./types";

describe("Alpaca utils", () => {
  describe("transactionToIntent", () => {
    describe("type", () => {
      it("fallbacks to 'Payment' without a transaction mode", () => {
        expect(
          transactionToIntent(
            { currency: { name: "ethereum", units: [{}] } } as Account,
            { mode: undefined } as GenericTransaction,
          ),
        ).toMatchObject({
          type: "Payment",
        });
      });

      it.each([
        ["changeTrust", "changeTrust"],
        ["send", "send"],
        ["send-legacy", "send-legacy"],
        ["send-eip1559", "send-eip1559"],
        ["stake", "stake"],
        ["unstake", "unstake"],
        ["delegate", "stake"],
        ["undelegate", "unstake"],
      ])(
        "by default, associates '%s' transaction mode to '%s' intent type",
        (mode, expectedType) => {
          expect(
            transactionToIntent(
              { currency: { name: "ethereum", units: [{}] } } as Account,
              { mode } as GenericTransaction,
            ),
          ).toMatchObject({
            type: expectedType,
          });
        },
      );

      it("rejects other modes", () => {
        expect(() =>
          transactionToIntent(
            { currency: { name: "ethereum", units: [{}] } } as Account,
            { mode: "any" as unknown } as GenericTransaction,
          ),
        ).toThrow("Unsupported transaction mode: any");
      });

      it("supersedes the logic with a custom function", () => {
        const computeIntentType = (transaction: GenericTransaction) =>
          transaction.mode === "send" && transaction.type === 2 ? "send-eip1559" : "send-legacy";

        expect(
          transactionToIntent(
            { currency: { name: "ethereum", units: [{}] } } as Account,
            { mode: "send", type: 2 } as GenericTransaction,
            computeIntentType,
          ),
        ).toMatchObject({
          type: "send-eip1559",
        });
      });
    });
  });

  describe("findCryptoCurrencyByNetwork", () => {
    it("finds a crypto currency by id", () => {
      expect(findCryptoCurrencyByNetwork("ethereum")).toMatchObject({
        id: "ethereum",
        family: "evm",
      });
    });

    it("takes currency remapping into account", () => {
      expect(findCryptoCurrencyByNetwork("ripple")).toMatchObject({
        id: "ripple",
        family: "xrp",
      });
      expect(findCryptoCurrencyByNetwork("xrp")).toMatchObject({
        id: "ripple",
        family: "xrp",
      });
    });

    it("does not find non existing currencies", () => {
      expect(findCryptoCurrencyByNetwork("non_existing_currency")).toBeUndefined();
    });
  });

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

    it("does not include fees in non native asset value", () => {
      expect(
        adaptCoreOperationToLiveOperation("account", {
          id: "operation",
          asset: { type: "token", assetOwner: "owner", assetReference: "reference" },
          type: "OUT",
          value: BigInt(100),
          tx: {
            hash: "hash",
            fees: BigInt(10),
            block: {
              hash: "block_hash",
              height: 123456,
            },
            date: new Date("2025-08-29T12:00:00Z"),
          },
          senders: ["sender"],
          recipients: ["recipient"],
        }),
      ).toEqual({
        id: "account-hash-OUT",
        hash: "hash",
        accountId: "account",
        type: "OUT",
        value: new BigNumber(100), // value only
        fee: new BigNumber(10),
        extra: {
          assetOwner: "owner",
          assetReference: "reference",
        },
        blockHash: "block_hash",
        blockHeight: 123456,
        senders: ["sender"],
        recipients: ["recipient"],
        date: new Date("2025-08-29T12:00:00Z"),
        transactionSequenceNumber: undefined,
        hasFailed: false,
      });
    });

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

    it.each([["FEES"], ["DELEGATE"], ["UNDELEGATE"]])(
      "handles %s operation where value = value + fees",
      operationType => {
        const op = {
          ...baseOp,
          type: operationType,
          value: BigInt(5),
          tx: { ...baseOp.tx, fees: BigInt(2) },
        };

        const result = adaptCoreOperationToLiveOperation(accountId, op);

        expect(result.value.toString()).toEqual("7");
      },
    );

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
