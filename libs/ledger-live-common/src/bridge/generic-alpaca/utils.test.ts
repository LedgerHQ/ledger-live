import {
  adaptCoreOperationToLiveOperation,
  buildOptimisticOperation,
  cleanedOperation,
  extractBalance,
  findCryptoCurrencyByNetwork,
  transactionToIntent,
} from "./utils";
import BigNumber from "bignumber.js";
import { Operation as CoreOperation } from "@ledgerhq/coin-framework/api/types";
import { Account } from "@ledgerhq/types-live";
import { GenericTransaction, OperationCommon } from "./types";

describe("Alpaca utils", () => {
  describe("buildOptimisticOperation", () => {
    it.each([
      [
        "coin",
        "changeTrust",
        {},
        {
          parentType: "OPT_IN",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "coin",
        "delegate",
        {},
        {
          parentType: "DELEGATE",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "coin",
        "stake",
        {},
        {
          parentType: "DELEGATE",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "coin",
        "undelegate",
        {},
        {
          parentType: "UNDELEGATE",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "coin",
        "unstake",
        {},
        {
          parentType: "UNDELEGATE",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "coin",
        "send",
        {},
        {
          parentType: "OUT",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "token",
        "changeTrust",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "OPT_IN",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
      [
        "token",
        "delegate",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "DELEGATE",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
      [
        "token",
        "stake",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "DELEGATE",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
      [
        "token",
        "undelegate",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "UNDELEGATE",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
      [
        "token",
        "unstake",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "UNDELEGATE",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
      [
        "token",
        "send",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "OUT",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
    ])("builds an optimistic %s operation with %s mode ", (_s, mode, params, expected) => {
      const operation = buildOptimisticOperation(
        {
          id: "parent-account-id",
          freshAddress: "account-address",
          subAccounts: [{ id: "sub-account-id", token: { contractAddress: "contract-address" } }],
        } as Account,
        {
          mode,
          amount: new BigNumber(50),
          fees: new BigNumber(12),
          recipient: "recipient-address",
          recipientDomain: {
            registry: "ens",
            domain: "recipient.eth",
            address: "recipient-address",
            type: "forward",
          },
          ...params,
        } as GenericTransaction,
      );

      expect(operation).toMatchObject({
        id: `parent-account-id--${expected.parentType}`,
        type: expected.parentType,
        value: expected.parentValue,
        accountId: "parent-account-id",
        senders: ["account-address"],
        recipients: ["recipient-address"],
        fee: new BigNumber(12),
        blockHash: null,
        blockHeight: null,
        transactionRaw: {
          amount: expected.subType ? "0" : expected.parentValue.toFixed(),
          fees: "12",
          recipient: expected.parentRecipient,
          recipientDomain: {
            registry: "ens",
            domain: "recipient.eth",
            address: "recipient-address",
            type: "forward",
          },
        },
        ...(expected.subType
          ? {
              subOperations: [
                {
                  id: `sub-account-id--${expected.subType}`,
                  accountId: "sub-account-id",
                  type: expected.subType,
                  senders: ["account-address"],
                  recipients: ["recipient-address"],
                  value: new BigNumber(50),
                  blockHash: null,
                  blockHeight: null,
                  transactionRaw: {
                    amount: "50",
                    fees: "12",
                    recipient: "recipient-address",
                  },
                },
              ],
            }
          : {}),
      });
    });
  });

  describe("cleanedOperation", () => {
    it("creates a cleaned version of an operation without mutating it", () => {
      const dirty = {
        id: "id",
        hash: "hash",
        senders: ["sender"],
        recipients: ["recipient"],
        extra: { assetAmount: 5, assetReference: "USDC", paginationToken: "pagination" },
      } as unknown as OperationCommon;

      const clean = cleanedOperation(dirty);

      expect(clean).toEqual({
        id: "id",
        hash: "hash",
        senders: ["sender"],
        recipients: ["recipient"],
        extra: { paginationToken: "pagination" },
      });
      expect(dirty).toEqual({
        id: "id",
        hash: "hash",
        senders: ["sender"],
        recipients: ["recipient"],
        extra: { assetAmount: 5, assetReference: "USDC", paginationToken: "pagination" },
      });
    });
  });

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
