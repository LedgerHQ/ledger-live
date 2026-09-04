/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {
  adaptCoreOperationToLiveOperation,
  bigNumberToBigIntDeep,
  buildOptimisticOperation,
  cleanedOperation,
  extractBalance,
  extractBalances,
  findCryptoCurrencyByNetwork,
  frameworkExtraFromRaw,
  frameworkExtraToRaw,
  isOperationType,
  mergeExtra,
  nextSequenceWithPending,
  toGasOptionsFromUnknown,
  transactionToIntent,
} from "./utils";
import { addPendingOperation } from "@ledgerhq/ledger-wallet-framework/account/index";
import BigNumber from "bignumber.js";
import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import { Account, Operation } from "@ledgerhq/types-live";
import {
  GenericTransaction,
  GenericTransactionMode,
  GenericTransactionRaw,
  OperationCommon,
} from "./types";
import * as craftTransactionDataModule from "@ledgerhq/coin-module-framework/logic/craftTransactionData";

jest.mock("@ledgerhq/coin-module-framework/logic/craftTransactionData", () => {
  const originalModule = jest.requireActual(
    "@ledgerhq/coin-module-framework/logic/craftTransactionData",
  );
  return {
    ...originalModule,
    craftTransactionData: jest.fn().mockReturnValue({ type: "none" }),
  };
});

describe("coin-framework utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("toGasOptionsFromUnknown", () => {
    it.each([undefined, null, "", 0, "str", [], { foo: "bar" }])(
      "returns undefined for invalid value %j",
      value => {
        expect(toGasOptionsFromUnknown(value)).toBeUndefined();
      },
    );

    it.each([
      ["slow", { medium: {}, fast: {} }],
      ["medium", { slow: {}, fast: {} }],
      ["fast", { slow: {}, medium: {} }],
    ])("returns undefined when %s key is missing", (_missingKey, value) => {
      expect(toGasOptionsFromUnknown(value)).toBeUndefined();
    });

    it("converts bigint fee fields to BigNumber", () => {
      const apiGasOptions = {
        slow: {
          gasPrice: 10n,
          maxFeePerGas: 20n,
          maxPriorityFeePerGas: 2n,
          nextBaseFee: 15n,
        },
        medium: {
          gasPrice: 12n,
          maxFeePerGas: 24n,
          maxPriorityFeePerGas: 3n,
          nextBaseFee: 18n,
        },
        fast: {
          gasPrice: 15n,
          maxFeePerGas: 30n,
          maxPriorityFeePerGas: 5n,
          nextBaseFee: 22n,
        },
      };

      expect(toGasOptionsFromUnknown(apiGasOptions)).toEqual({
        slow: {
          gasPrice: new BigNumber(10),
          maxFeePerGas: new BigNumber(20),
          maxPriorityFeePerGas: new BigNumber(2),
          nextBaseFee: new BigNumber(15),
        },
        medium: {
          gasPrice: new BigNumber(12),
          maxFeePerGas: new BigNumber(24),
          maxPriorityFeePerGas: new BigNumber(3),
          nextBaseFee: new BigNumber(18),
        },
        fast: {
          gasPrice: new BigNumber(15),
          maxFeePerGas: new BigNumber(30),
          maxPriorityFeePerGas: new BigNumber(5),
          nextBaseFee: new BigNumber(22),
        },
      });
    });

    it("converts number and string fee fields to BigNumber", () => {
      const apiGasOptions = {
        slow: { gasPrice: 10, maxFeePerGas: "20" },
        medium: { gasPrice: 12, maxFeePerGas: "24" },
        fast: { gasPrice: 15, maxFeePerGas: "30" },
      };

      expect(toGasOptionsFromUnknown(apiGasOptions)).toEqual({
        slow: {
          gasPrice: new BigNumber(10),
          maxFeePerGas: new BigNumber(20),
          maxPriorityFeePerGas: null,
          nextBaseFee: null,
        },
        medium: {
          gasPrice: new BigNumber(12),
          maxFeePerGas: new BigNumber(24),
          maxPriorityFeePerGas: null,
          nextBaseFee: null,
        },
        fast: {
          gasPrice: new BigNumber(15),
          maxFeePerGas: new BigNumber(30),
          maxPriorityFeePerGas: null,
          nextBaseFee: null,
        },
      });
    });

    it("returns FeeData with null fields when strategy objects are empty", () => {
      const apiGasOptions = {
        slow: {},
        medium: {},
        fast: {},
      };

      expect(toGasOptionsFromUnknown(apiGasOptions)).toEqual({
        slow: {
          gasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          nextBaseFee: null,
        },
        medium: {
          gasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          nextBaseFee: null,
        },
        fast: {
          gasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          nextBaseFee: null,
        },
      });
    });
  });

  describe("bigNumberToBigIntDeep", () => {
    it.each([
      [undefined, undefined],
      [null, null],
      ["", ""],
      ["str", "str"],
      [0, 0],
      [1, 1],
      [true, true],
      [false, false],
      [new BigNumber(0), 0n],
      [new BigNumber(1), 1n],
      [[], []],
      [
        ["str", 1],
        ["str", 1],
      ],
      [
        ["str", BigNumber(1)],
        ["str", 1n],
      ],
      [
        [new BigNumber(0), new BigNumber(1)],
        [0n, 1n],
      ],
      [{}, {}],
      [
        { a: "str", b: 0, c: true },
        { a: "str", b: 0, c: true },
      ],
      [
        { a: "str", b: new BigNumber(1), c: true },
        { a: "str", b: 1n, c: true },
      ],
      [
        { a: "str", b: new BigNumber(1), c: { ca: new BigNumber(2), cb: 4 } },
        { a: "str", b: 1n, c: { ca: 2n, cb: 4 } },
      ],
      [
        { a: "str", b: new BigNumber(1), c: { ca: new BigNumber(2), cb: null } },
        { a: "str", b: 1n, c: { ca: 2n, cb: null } },
      ],
      [
        { a: "str", b: new BigNumber(1), c: { ca: new BigNumber(2), cb: undefined } },
        { a: "str", b: 1n, c: { ca: 2n } },
      ],
    ])("replaces BigNumbers with BigInts (%j)", (input, output) => {
      expect(bigNumberToBigIntDeep(input)).toStrictEqual(output);
    });
  });

  // A family that describes its own operation uses the memo field for plumbing -- Solana carries the
  // stake account there -- so only the ones the framework typed itself may claim a user memo.
  describe("buildOptimisticOperation memo", () => {
    const account = {
      id: "acc",
      freshAddress: "sender",
      currency: { units: [{ magnitude: 9 }] },
      subAccounts: [],
      pendingOperations: [],
    } as unknown as Account;
    const transaction = {
      recipient: "dest",
      amount: new BigNumber(1),
      fees: new BigNumber(5000),
      memoValue: "a memo",
    } as unknown as GenericTransaction;

    it("carries the memo of a plain transfer", () => {
      const op = buildOptimisticOperation(account, transaction, undefined, () => undefined);

      expect(op.extra).toMatchObject({ memo: "a memo" });
    });

    it("drops it when the family typed the operation itself", () => {
      const op = buildOptimisticOperation(
        account,
        { ...transaction, mode: "split" } as unknown as GenericTransaction,
        undefined,
        () => ({ type: "FEES", value: new BigNumber(5000) }),
      );

      expect(op.extra).not.toHaveProperty("memo");
    });
  });

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
        "redelegate",
        {},
        {
          parentType: "REDELEGATE",
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
          parentType: "STAKE",
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
          parentType: "UNSTAKE",
          subType: undefined,
          parentValue: new BigNumber(50),
          parentRecipient: "recipient-address",
        },
      ],
      [
        "coin",
        "finalize_unstake",
        {},
        {
          parentType: "FINALIZE_UNSTAKE",
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
          subType: "STAKE",
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
          subType: "UNSTAKE",
          parentValue: new BigNumber(12),
          parentRecipient: "contract-address",
        },
      ],
      [
        "token",
        "finalize_unstake",
        { subAccountId: "sub-account-id" },
        {
          parentType: "FEES",
          subType: "FINALIZE_UNSTAKE",
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
    ])("builds an optimistic %s operation with %s mode", (_s, mode, params, expected) => {
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
        3n,
      );

      expect(operation).toMatchObject({
        id: `parent-account-id--${expected.parentType}`,
        transactionSequenceNumber: new BigNumber(3),
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
                  transactionSequenceNumber: new BigNumber(3),
                  accountId: "sub-account-id",
                  type: expected.subType,
                  senders: ["account-address"],
                  recipients: ["recipient-address"],
                  fee: new BigNumber(12),
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

    it("converts a fee at or above 1e21, where BigNumber switches to exponential notation", () => {
      const fees = new BigNumber("1500000000000000000000");
      const amount = new BigNumber("10000000000000000000000000");

      expect(fees.toString()).toBe("1.5e+21");
      expect(() => BigInt(fees.toString())).toThrow(SyntaxError);

      const operation = buildOptimisticOperation(
        { id: "parent-account-id", freshAddress: "account-address" } as Account,
        {
          mode: "send",
          amount,
          fees,
          recipient: "recipient-address",
        } as GenericTransaction,
        3n,
      );

      expect(operation.fee).toEqual(fees);
      expect(operation.value).toEqual(amount);
    });

    it("carries familySpecificData into transactionRaw so a pending operation survives restore", () => {
      const familySpecificData = { chosenOption: "OPTION_A", chosenList: ["a", "b"] };
      const operation = buildOptimisticOperation(
        {
          id: "parent-account-id",
          freshAddress: "account-address",
        } as Account,
        {
          family: "familyx",
          amount: new BigNumber(100),
          recipient: "TRecipient",
          familySpecificData,
        } as GenericTransaction,
        3n,
      );

      expect(
        (operation.transactionRaw as GenericTransactionRaw | undefined)?.familySpecificData,
      ).toEqual(familySpecificData);
    });

    it("omits feeParameters from transactionRaw (derived, recomputed on restore)", () => {
      const operation = buildOptimisticOperation(
        {
          id: "parent-account-id",
          freshAddress: "account-address",
        } as Account,
        {
          family: "familyx",
          amount: new BigNumber(100),
          recipient: "TRecipient",
          feeParameters: { energyRequired: "1200" },
        } as unknown as GenericTransaction,
        3n,
      );

      const raw = operation.transactionRaw as
        | (GenericTransactionRaw & { feeParameters?: unknown })
        | undefined;
      expect(raw?.feeParameters).toBeUndefined();
      expect(raw && "feeParameters" in raw).toBe(false);
    });

    it("takes a described type and value from the family", () => {
      const describeOptimisticOperation = jest.fn().mockReturnValue({
        type: "FREEZE" as const,
        value: new BigNumber(0),
      });
      const operation = buildOptimisticOperation(
        {
          id: "parent-account-id",
          freshAddress: "account-address",
        } as Account,
        {
          family: "familyx",
          amount: new BigNumber(100),
          recipient: "TRecipient",
          mode: "stake",
        } as GenericTransaction,
        3n,
        describeOptimisticOperation,
      );

      expect(operation.type).toBe("FREEZE");
      expect(operation.value).toEqual(new BigNumber(0));
      expect((operation.extra as Record<string, unknown>).ledgerOpType).toBe("FREEZE");
    });

    it("carries the family's own extra keys but never a framework-owned one", () => {
      const describeOptimisticOperation = jest.fn().mockReturnValue({
        type: "FREEZE" as const,
        value: new BigNumber(0),
        extra: {
          frozenAmount: new BigNumber(5),
          ledgerOpType: "HIJACKED",
          index: "9",
          internal: true,
        },
      });
      const operation = buildOptimisticOperation(
        {
          id: "parent-account-id",
          freshAddress: "account-address",
        } as Account,
        {
          family: "familyx",
          amount: new BigNumber(100),
          recipient: "TRecipient",
          mode: "stake",
        } as GenericTransaction,
        3n,
        describeOptimisticOperation,
      );

      const extra = operation.extra as Record<string, unknown>;
      expect(extra.frozenAmount).toEqual(new BigNumber(5));
      expect(extra.ledgerOpType).toBe("FREEZE");
      expect(extra.index).toBe("0");
      // Stripped rather than overwritten, so the pending row's shape matches the synced operation's,
      // which `adaptCoreOperationToLiveOperation` strips the same way.
      expect("internal" in extra).toBe(false);
    });

    it("keeps generic behaviour when the family does not own the mode", () => {
      const describeOptimisticOperation = jest.fn().mockReturnValue(undefined);
      const operation = buildOptimisticOperation(
        {
          id: "parent-account-id",
          freshAddress: "account-address",
        } as Account,
        {
          family: "familyx",
          amount: new BigNumber(100),
          recipient: "TRecipient",
          mode: "stake",
        } as GenericTransaction,
        3n,
        describeOptimisticOperation,
      );

      expect(operation.type).toBe("STAKE");
      expect(operation.value).toEqual(new BigNumber(100));
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
        ["finalize_unstake", "finalize_unstake"],
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

      it.each([
        { mode: "stake", useAllAmount: false },
        { mode: "stake", useAllAmount: true },
        { mode: "unstake", useAllAmount: false },
        { mode: "unstake", useAllAmount: true },
        { mode: "finalize_unstake", useAllAmount: false },
        { mode: "finalize_unstake", useAllAmount: true },
      ] as const)(
        "preserves user-typed amount and useAllAmount=$useAllAmount for $mode staking intent",
        ({ mode, useAllAmount }) => {
          const intent = transactionToIntent(
            { currency: { name: "tezos", units: [{}] } } as Account,
            { mode, amount: new BigNumber(100), useAllAmount } as GenericTransaction,
          );
          expect(intent).toMatchObject({
            intentType: "staking",
            type: mode,
            amount: 100n,
            useAllAmount,
          });
        },
      );

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

    describe("senderPublicKey", () => {
      it("propagates account.xpub, cached from the device's getAddress at sync time", () => {
        const intent = transactionToIntent(
          { currency: { name: "stacks", units: [{}] }, xpub: "02abc" } as Account,
          { mode: "send" } as GenericTransaction,
        );
        expect(intent).toMatchObject({ senderPublicKey: "02abc" });
      });

      it("is undefined when the account has no cached xpub", () => {
        const intent = transactionToIntent(
          { currency: { name: "ethereum", units: [{}] } } as Account,
          { mode: "send" } as GenericTransaction,
        );
        expect(intent.senderPublicKey).toBeUndefined();
      });
    });

    describe("craftTransactionData", () => {
      it.each([
        { title: "undefined", data: undefined },
        { title: "empty", data: Buffer.from("") },
      ])("should use provided craftTransactionData when data is $title", ({ data }) => {
        const defaultCraftTransactionDataSpy = jest.spyOn(
          craftTransactionDataModule,
          "craftTransactionData",
        );
        const expectedData = {
          type: "buffer",
          value: Buffer.from(
            "1794958f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000440e0cd9cdb4af547ee08c2e9c3091a9e342799d013aded94214fff87bea5c7069a000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e300000000000000000000000000000000000000000000000000018c5e679f058000000000000000000000000000000000000000000000000000000000000021050000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000066163726f7373000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000075f6c65646765720000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000685527c551cc40ce1f1c9818cd8683307076e4ed000000000000000000000000685527c551cc40ce1f1c9818cd8683307076e4ed0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018ff7eea2040000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c40e8ae67f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c06ebbefd94032b85424d51906e2a335efae264b000000000000000000000000000000000000000000000000000000ccc8ab55000000000000000000000000002d1c5382748559ba877246db753cacbc54d5b9b4000000000000000000000000000000000000000000000000000002ccbe57a9800000000000000000000000000000000000000000000000000000000000000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000004d4717adf15c04e0c8f84d448b7c76f60864bf38000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000420000000000000000000000000000000000000600000000000000000000000000000000000000000000000000018a997696af320000000000000000000000000000000000000000000000000dd0daeaf3b8fcff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000069f0d05b0000000000000000000000000000000000000000000000000000000069f0f4ce000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000",
          ),
        };
        const craftTransactionDataMock = jest.fn().mockReturnValueOnce(expectedData);

        const intent = transactionToIntent(
          {
            currency: {
              name: "ethereum",
              units: ["wei"],
            },
          } as unknown as Account,
          { data } as unknown as GenericTransaction,
          undefined,
          craftTransactionDataMock,
        );

        expect(intent).toMatchObject({ data: expectedData });

        expect(craftTransactionDataMock).toHaveBeenCalledTimes(1);
        expect(defaultCraftTransactionDataSpy).not.toHaveBeenCalled();
      });

      it("should use default craftTransactionData when not provided", () => {
        const defaultCraftTransactionDataSpy = jest.spyOn(
          craftTransactionDataModule,
          "craftTransactionData",
        );

        transactionToIntent(
          {
            currency: {
              name: "ethereum",
              units: ["wei"],
            },
          } as unknown as Account,
          {} as unknown as GenericTransaction,
          undefined,
          undefined,
        );

        expect(defaultCraftTransactionDataSpy).toHaveBeenCalledTimes(1);
      });

      it("should set data from transaction when non empty and does not call craftTransactionData", () => {
        const defaultCraftTransactionDataSpy = jest.spyOn(
          craftTransactionDataModule,
          "craftTransactionData",
        );
        const craftTransactionDataMock = jest.fn();
        const expectedData = Buffer.from("some random data");

        const intent = transactionToIntent(
          {
            currency: {
              name: "ethereum",
              units: ["wei"],
            },
          } as unknown as Account,
          { data: expectedData } as unknown as GenericTransaction,
          undefined,
          craftTransactionDataMock,
        );

        expect(intent).toMatchObject({ data: { type: "buffer", value: expectedData } });

        expect(craftTransactionDataMock).not.toHaveBeenCalled();
        expect(defaultCraftTransactionDataSpy).not.toHaveBeenCalled();
      });

      it("prefers transaction.data over a family buildIntentData too", () => {
        const buildIntentData = jest.fn();
        const craftTransactionDataMock = jest.fn();
        const expectedData = Buffer.from("deadbeef", "hex");

        const intent = transactionToIntent(
          {
            currency: { name: "ethereum", units: ["wei"] },
          } as unknown as Account,
          { data: expectedData } as unknown as GenericTransaction,
          undefined,
          craftTransactionDataMock,
          buildIntentData,
        );

        expect(intent).toMatchObject({ data: { type: "buffer", value: expectedData } });
        expect(buildIntentData).not.toHaveBeenCalled();
        expect(craftTransactionDataMock).not.toHaveBeenCalled();
      });
    });

    describe("memo", () => {
      const account = { currency: { name: "ethereum", units: [{}] } } as Account;

      it("defaults to the framework's MemoNotSupported when no memo or tag is provided", () => {
        const intent = transactionToIntent(account, {} as GenericTransaction);
        expect(intent.memo).toEqual({ type: "none" });
      });

      it.each([
        [0, "0"],
        [1, "1"],
      ])("maps tag '%s' to a destination tag memo", (tag, expectedTag) => {
        const intent = transactionToIntent(account, { tag } as GenericTransaction);
        expect(intent.memo).toEqual({
          type: "map",
          memos: new Map([["destinationTag", expectedTag]]),
        });
      });

      it("maps memoType/memoValue to a StringMemo with memoType as its kind", () => {
        const intent = transactionToIntent(account, {
          memoType: "memo-type",
          memoValue: "memo-value",
        } as GenericTransaction);
        expect(intent.memo).toEqual({ type: "string", kind: "memo-type", value: "memo-value" });
      });

      it("prefers tag over memoType/memoValue when both are set", () => {
        const intent = transactionToIntent(account, {
          tag: 42,
          memoType: "memo-type",
          memoValue: "memo-value",
        } as GenericTransaction);
        expect(intent.memo).toEqual({
          type: "map",
          memos: new Map([["destinationTag", "42"]]),
        });
      });
    });

    it.each([
      "delegate",
      "undelegate",
      "redelegate",
      "claimReward",
      "compoundReward",
    ] as GenericTransactionMode[])(
      "should return a correct intent for a delegation transaction with mode %s",
      mode => {
        const valAddress = "0x5A7FC11397E9a8AD41BF10bf13F22B0a63f96f6d";
        const dstValAddress = "0x82eB45562F991329ED2867F43fc60F0Ba52C3Dab";
        const transaction: GenericTransaction = {
          amount: BigNumber(1),
          family: "evm",
          mode,
          recipient: "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1",
          valAddress,
          dstValAddress,
        };
        const computeIntentType = transaction => transaction.mode;

        const intent = transactionToIntent(
          {
            currency: {
              name: "ethereum",
              units: [
                {
                  name: "ethereum",
                  code: "ETH",
                  magnitude: 1,
                },
              ],
            },
          } as Account,
          transaction,
          computeIntentType,
        );
        expect(intent).toMatchObject({
          intentType: "staking",
          mode,
          valAddress,
          dstValAddress,
        });
      },
    );

    it.each([
      "delegate",
      "undelegate",
      "redelegate",
      "claimReward",
      "compoundReward",
    ] as GenericTransactionMode[])(
      "should return an intent without delegation fields when missing from transaction for mode %s",
      mode => {
        const transaction: GenericTransaction = {
          amount: BigNumber(1),
          family: "evm",
          mode,
          recipient: "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1",
        };
        const computeIntentType = transaction => transaction.mode;

        const intent = transactionToIntent(
          {
            currency: {
              name: "ethereum",
              units: [
                {
                  name: "ethereum",
                  code: "ETH",
                  magnitude: 1,
                },
              ],
            },
          } as Account,
          transaction,
          computeIntentType,
        );

        expect(intent.intentType).toBe("staking");
        expect(intent.mode).toBe(undefined);
        expect(intent.valAddress).toBe(undefined);
        expect(intent.dstValAddress).toBe(undefined);
      },
    );
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

  describe("extractBalances", () => {
    it("extracts native balance only", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 0n, asset: { type: "native" } }]);

      expect(
        extractBalances({
          spendableBalance: BigNumber(8),
          balance: BigNumber(10),
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 2n, asset: { type: "native" } }]);
    });

    it("extracts native and token balances", () => {
      expect(
        extractBalances(
          {
            spendableBalance: BigNumber(10),
            balance: BigNumber(10),
            subAccounts: [
              {
                spendableBalance: BigNumber(11),
                balance: BigNumber(20),
                token: {
                  tokenType: "erc20",
                  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
              },
            ],
          } as unknown as Account,
          token => ({
            type: token.tokenType,
            assetReference: token.contractAddress,
          }),
        ),
      ).toEqual([
        { value: 10n, locked: 0n, asset: { type: "native" } },
        {
          asset: {
            assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            type: "erc20",
          },
          locked: 9n,
          value: 20n,
        },
      ]);
    });

    it("locks native funds committed by a pending send (value + fee)", () => {
      // Balance 10, a pending native send already commits amount 4 + fee 1.
      // Spendable must drop to 5, not stay at 10.
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "OUT", value: BigNumber(4), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 5n, asset: { type: "native" } }]);
    });

    it("stacks the chain reserve and pending spend, capped at balance", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(8),
          balance: BigNumber(10),
          pendingOperations: [{ type: "OUT", value: BigNumber(3), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 6n, asset: { type: "native" } }]);

      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "OUT", value: BigNumber(20), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 10n, asset: { type: "native" } }]);
    });

    it("locks value + fee for any outgoing (OUT-family) pending op, e.g. DELEGATE", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "DELEGATE", value: BigNumber(4), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 5n, asset: { type: "native" } }]);
    });

    it("locks the fee even for a zero-value outgoing pending op (e.g. OPT_IN)", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "OPT_IN", value: BigNumber(0), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 1n, asset: { type: "native" } }]);
    });

    it("locks only the fee on native for staking-family ops (e.g. STAKE)", () => {
      // STAKE is not in OPERATION_TYPE_OUT_FAMILY; only the gas fee leaves the
      // (total) native balance, the value stays staked.
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "STAKE", value: BigNumber(4), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 1n, asset: { type: "native" } }]);
    });

    it("locks the fee for a self-initiated incoming-family op (e.g. claim REWARD)", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "REWARD", value: BigNumber(0), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 1n, asset: { type: "native" } }]);

      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "REWARD", value: BigNumber(4), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 1n, asset: { type: "native" } }]);
    });

    it("locks only the fee on native for a pending token send (FEES op)", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "FEES", value: BigNumber(1), fee: BigNumber(1) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 1n, asset: { type: "native" } }]);
    });

    it("locks token funds committed by a pending token send (value only, fee is native)", () => {
      expect(
        extractBalances(
          {
            spendableBalance: BigNumber(10),
            balance: BigNumber(10),
            subAccounts: [
              {
                spendableBalance: BigNumber(20),
                balance: BigNumber(20),
                pendingOperations: [{ type: "OUT", value: BigNumber(5), fee: BigNumber(1) }],
                token: {
                  tokenType: "erc20",
                  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
              },
            ],
          } as unknown as Account,
          token => ({
            type: token.tokenType,
            assetReference: token.contractAddress,
          }),
        ),
      ).toEqual([
        { value: 10n, locked: 0n, asset: { type: "native" } },
        {
          asset: {
            assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            type: "erc20",
          },
          locked: 5n,
          value: 20n,
        },
      ]);
    });

    it("locks token value for staking-family sub-ops (e.g. STAKE)", () => {
      expect(
        extractBalances(
          {
            spendableBalance: BigNumber(10),
            balance: BigNumber(10),
            subAccounts: [
              {
                spendableBalance: BigNumber(20),
                balance: BigNumber(20),
                pendingOperations: [{ type: "STAKE", value: BigNumber(8), fee: BigNumber(1) }],
                token: {
                  tokenType: "erc20",
                  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
              },
            ],
          } as unknown as Account,
          token => ({
            type: token.tokenType,
            assetReference: token.contractAddress,
          }),
        ),
      ).toEqual([
        { value: 10n, locked: 0n, asset: { type: "native" } },
        {
          asset: {
            assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            type: "erc20",
          },
          locked: 8n,
          value: 20n,
        },
      ]);
    });

    it("locks token value for non-OUT outgoing sub-ops (e.g. DELEGATE), fee stays native", () => {
      expect(
        extractBalances(
          {
            spendableBalance: BigNumber(10),
            balance: BigNumber(10),
            subAccounts: [
              {
                spendableBalance: BigNumber(20),
                balance: BigNumber(20),
                // buildOptimisticOperation appends the mode's type to the token sub-account.
                pendingOperations: [{ type: "DELEGATE", value: BigNumber(7), fee: BigNumber(1) }],
                token: {
                  tokenType: "erc20",
                  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
              },
            ],
          } as unknown as Account,
          token => ({
            type: token.tokenType,
            assetReference: token.contractAddress,
          }),
        ),
      ).toEqual([
        { value: 10n, locked: 0n, asset: { type: "native" } },
        {
          asset: {
            assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            type: "erc20",
          },
          locked: 7n,
          value: 20n,
        },
      ]);
    });

    it("ignores pending incoming operations", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [{ type: "IN", value: BigNumber(5), fee: BigNumber(0) }],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 0n, asset: { type: "native" } }]);
    });

    it("does not lock the fee for a sponsored (gasless) pending send, only the value", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [
            {
              type: "OUT",
              value: BigNumber(4),
              fee: BigNumber(1),
              transactionRaw: { sponsored: true },
            },
          ],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 4n, asset: { type: "native" } }]);
    });

    it("locks nothing on native for a sponsored pending token send (FEES op)", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [
            {
              type: "FEES",
              value: BigNumber(1),
              fee: BigNumber(1),
              transactionRaw: { sponsored: true },
            },
          ],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 0n, asset: { type: "native" } }]);
    });

    it("locks nothing on native for a sponsored staking-family pending op (e.g. STAKE)", () => {
      expect(
        extractBalances({
          spendableBalance: BigNumber(10),
          balance: BigNumber(10),
          pendingOperations: [
            {
              type: "STAKE",
              value: BigNumber(4),
              fee: BigNumber(1),
              transactionRaw: { sponsored: true },
            },
          ],
        } as unknown as Account),
      ).toEqual([{ value: 10n, locked: 0n, asset: { type: "native" } }]);
    });
  });

  // Copilot warned that getPendingTokenSpent could lock native fees as token amount,
  // because "FEES" is in OPERATION_TYPE_OUT_FAMILY and some fixtures/source data can
  // attach a pending FEES op to a token sub-account.
  // For optimistic ops produced via buildOptimisticOperation, addPendingOperation routes
  // the FEES *parent* op to the native account and the OUT *sub*-op to the token account.
  describe("real pending-op distribution (buildOptimisticOperation + addPendingOperation)", () => {
    const subAccountId = "sub-account-id";
    const buildAccount = (): Account =>
      ({
        id: "parent-account-id",
        freshAddress: "account-address",
        balance: BigNumber(100),
        spendableBalance: BigNumber(100),
        pendingOperations: [],
        subAccounts: [
          {
            id: subAccountId,
            balance: BigNumber(20),
            spendableBalance: BigNumber(20),
            pendingOperations: [],
            token: {
              tokenType: "erc20",
              contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            },
          },
        ],
      }) as unknown as Account;

    it("routes the FEES op to the native account and the OUT op to the token sub-account", () => {
      const account = buildAccount();
      const optimistic = buildOptimisticOperation(
        account,
        {
          mode: "send",
          subAccountId,
          amount: BigNumber(5),
          fees: BigNumber(2),
          recipient: "recipient-address",
        } as unknown as GenericTransaction,
        7n,
      );

      const updated = addPendingOperation(account, optimistic);

      // Parent (native) account holds the FEES op, NOT the sub-account.
      expect(updated.pendingOperations).toEqual([
        expect.objectContaining({ type: "FEES", accountId: "parent-account-id" }),
      ]);
      // The token sub-account holds the OUT sub-op with the token value, no FEES op.
      const subPending = updated.subAccounts![0].pendingOperations;
      expect(subPending).toEqual([
        expect.objectContaining({ type: "OUT", accountId: subAccountId, value: BigNumber(5) }),
      ]);
      expect(subPending.some(op => op.type === "FEES")).toBe(false);
    });

    it("locks only the token amount on the sub-account (native fee is not locked as token)", () => {
      const account = buildAccount();
      const optimistic = buildOptimisticOperation(
        account,
        {
          mode: "send",
          subAccountId,
          amount: BigNumber(5),
          fees: BigNumber(2),
          recipient: "recipient-address",
        } as unknown as GenericTransaction,
        7n,
      );

      const updated = addPendingOperation(account, optimistic);

      expect(
        extractBalances(updated, token => ({
          type: token.tokenType,
          assetReference: token.contractAddress,
        })),
      ).toEqual([
        // Native balance locks the pending fee only (2).
        { value: 100n, locked: 2n, asset: { type: "native" } },
        // Token balance locks the token amount only (5) — the fee (2) is NOT locked here.
        {
          asset: { assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", type: "erc20" },
          locked: 5n,
          value: 20n,
        },
      ]);
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

  // No module mock needed: encodeOperationId is deterministic in @ledgerhq/ledger-wallet-framework/operation.

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
          time: new Date("2025-08-29T12:00:00Z"),
        },
        date: new Date("2025-08-29T12:00:00Z"),
        failed: false,
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
              time: new Date("2025-08-29T12:00:00Z"),
            },
            date: new Date("2025-08-29T12:00:00Z"),
            failed: false,
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

    it.each([["FEES"], ["DELEGATE"], ["UNDELEGATE"], ["REDELEGATE"]])(
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

    it("shows fees in value when transaction has failed", () => {
      const failedOp = {
        ...baseOp,
        type: "OUT",
        value: BigInt(100),
        tx: { ...baseOp.tx, fees: BigInt(25), failed: true },
      };

      const result = adaptCoreOperationToLiveOperation(accountId, failedOp);

      expect(result).toMatchObject({
        hasFailed: true,
        value: new BigNumber(25),
        fee: new BigNumber(25),
      });
    });

    it.each([
      [0, new BigNumber(0)],
      [3, new BigNumber(3)],
      [undefined, undefined],
    ])("adapts a sequence of %s", (sequence, expected) => {
      const op = { ...baseOp, details: { sequence } };

      const result = adaptCoreOperationToLiveOperation(accountId, op);

      expect(result.transactionSequenceNumber).toEqual(expected);
    });

    it("maps details.transferId to extra.transferId", () => {
      const op = { ...baseOp, details: { transferId: "12345" } };
      const result = adaptCoreOperationToLiveOperation(accountId, op);
      expect((result.extra as Record<string, unknown>).transferId).toBe("12345");
    });

    it("does not set extra.transferId when details.transferId is absent", () => {
      const result = adaptCoreOperationToLiveOperation(accountId, baseOp);
      expect("transferId" in (result.extra as Record<string, unknown>)).toBe(false);
    });
  });

  describe("nextSequenceWithPending", () => {
    const pendingOp = (seq: number | null): Operation =>
      ({
        transactionSequenceNumber: seq === null ? undefined : new BigNumber(seq),
      }) as Operation;

    it("uses the network sequence when there are no pending operations", () => {
      expect(nextSequenceWithPending([], 22n)).toBe(22n);
    });

    it("bumps past a pending op the network source hasn't caught up to yet", () => {
      // Just broadcast nonce 22 (still pending); network source still reports 22 -> next must be 23.
      expect(nextSequenceWithPending([pendingOp(22)], 22n)).toBe(23n);
    });

    it("takes the highest pending sequence + 1 across several pending ops", () => {
      expect(nextSequenceWithPending([pendingOp(22), pendingOp(24), pendingOp(23)], 22n)).toBe(25n);
    });

    it("prefers the network sequence once it has moved ahead of pending ops", () => {
      // Network source caught up (26 > 24+1) -> it wins, self-correcting.
      expect(nextSequenceWithPending([pendingOp(24)], 26n)).toBe(26n);
    });

    it("ignores pending ops without a sequence number", () => {
      expect(nextSequenceWithPending([pendingOp(null), pendingOp(22)], 22n)).toBe(23n);
    });

    it("ignores non-integer pending sequence numbers", () => {
      expect(nextSequenceWithPending([pendingOp(22.5), pendingOp(22)], 22n)).toBe(23n);
    });

    it("handles a large pending sequence without throwing (fixed-point, not exponential)", () => {
      // BigNumber(1e21).toString() is "1e+21", which BigInt() cannot parse; .toFixed() must be used.
      expect(nextSequenceWithPending([pendingOp(1e21)], 5n)).toBe(1000000000000000000001n);
    });
  });

  describe("adaptCoreOperationToLiveOperation family extras", () => {
    // Kept as a precise `CoreOperation` cast rather than `as any`.
    const coreOperation: CoreOperation = {
      id: "op1",
      asset: { type: "native" },
      type: "FREEZE",
      value: BigInt(100),
      senders: ["TSender"],
      recipients: ["TRecipient"],
      tx: {
        hash: "hash1",
        fees: BigInt(1),
        block: {
          hash: "blockhash1",
          height: 1,
          time: new Date("2026-01-01"),
        },
        date: new Date("2026-01-01"),
        failed: false,
      },
      details: { ledgerOpType: "FREEZE", familyExtra: { frozenAmount: "42", votes: [] } },
    };

    it("lands the family's own extras bag flat beside the framework's keys", () => {
      const operation = adaptCoreOperationToLiveOperation("accountId", coreOperation);

      expect(operation.extra).toEqual({
        ledgerOpType: "FREEZE",
        frozenAmount: "42",
        votes: [],
      });
    });

    it("revives the bag through the family's `fromOperationExtraRaw` when one is given", () => {
      const operation = adaptCoreOperationToLiveOperation("accountId", coreOperation, extraRaw => {
        const { frozenAmount, ...rest } = extraRaw as { frozenAmount: string };
        return { ...rest, frozenAmount: new BigNumber(frozenAmount) };
      });

      expect((operation.extra as Record<string, unknown>).frozenAmount).toStrictEqual(
        new BigNumber(42),
      );
    });

    it("never lets the family shadow a framework-owned extra", () => {
      // Including `memo`, which the framework writes only when the coin module supplies one. The
      // reviver spreads its input, so this also pins the strip as running after it.
      const operation = adaptCoreOperationToLiveOperation(
        "accountId",
        {
          ...coreOperation,
          details: {
            ledgerOpType: "FREEZE",
            familyExtra: { ledgerOpType: "HIJACKED", internal: true, memo: "hijacked" },
          },
        },
        extraRaw => ({ ...(extraRaw as Record<string, unknown>) }),
      );
      const extra = operation.extra as Record<string, unknown>;

      expect(extra.ledgerOpType).toBe("FREEZE");
      expect(extra.internal).toBeUndefined();
      expect(extra.memo).toBeUndefined();
    });

    it("leaves the framework's own keys alone when the coin module sends no family bag", () => {
      const operation = adaptCoreOperationToLiveOperation("accountId", {
        ...coreOperation,
        details: { ledgerOpType: "FREEZE" },
      });

      expect(operation.extra).toEqual({ ledgerOpType: "FREEZE" });
    });

    it("normalises bigint/BigNumber inside familyExtra so the persisted operation stays JSON-safe", () => {
      const operation = adaptCoreOperationToLiveOperation("accountId", {
        ...coreOperation,
        details: {
          ledgerOpType: "FREEZE",
          familyExtra: {
            frozenAmount: 42n,
            reward: new BigNumber(1000),
            huge: new BigNumber("1e21"),
            votes: ["v1"],
          },
        },
      } as CoreOperation);

      expect(() => JSON.stringify(operation)).not.toThrow();
      expect(operation.extra).toEqual({
        ledgerOpType: "FREEZE",
        frozenAmount: "42",
        reward: "1000",
        huge: "1000000000000000000000",
        votes: ["v1"],
      });
    });

    it("normalises familyExtra exactly as a JSON round-trip would", () => {
      const operation = adaptCoreOperationToLiveOperation("accountId", {
        ...coreOperation,
        details: {
          ledgerOpType: "FREEZE",
          familyExtra: {
            claimedAt: new Date("2026-01-01T00:00:00.000Z"), // toJSON -> ISO string
            keep: "x",
            ok: true,
            fn: () => {}, // dropped
            sym: Symbol("s"), // dropped
            bad: NaN, // -> null
            gone: undefined, // dropped
            seq: [1, undefined, NaN, "x"], // holes -> null, length preserved
          },
        },
      } as CoreOperation);

      expect(operation.extra).toEqual({
        ledgerOpType: "FREEZE",
        claimedAt: "2026-01-01T00:00:00.000Z",
        keep: "x",
        ok: true,
        bad: null,
        seq: [1, null, null, "x"],
      });
    });

    it("maps each optional operation detail onto its framework extra key", () => {
      const operation = adaptCoreOperationToLiveOperation("accountId", {
        ...coreOperation,
        tx: { ...coreOperation.tx, feesPayer: "TFeePayer" },
        details: {
          ledgerOpType: "FREEZE",
          assetAmount: "500",
          assetSenders: ["TAssetSender"],
          assetRecipients: ["TAssetRecipient"],
          parentSenders: ["TParentSender"],
          parentRecipients: ["TParentRecipient"],
          memo: "a memo",
          internal: true,
          stake: { address: "TValidator", amount: 2_500n },
        },
      } as CoreOperation);

      expect(operation.extra).toEqual({
        ledgerOpType: "FREEZE",
        assetAmount: "500",
        assetSenders: ["TAssetSender"],
        assetRecipients: ["TAssetRecipient"],
        parentSenders: ["TParentSender"],
        parentRecipients: ["TParentRecipient"],
        memo: "a memo",
        internal: true,
        feePayer: "TFeePayer",
        stake: { address: "TValidator", amount: new BigNumber(2_500) },
      });
      // parentSenders/parentRecipients also stand in for the operation's own senders/recipients.
      expect(operation.senders).toEqual(["TParentSender"]);
      expect(operation.recipients).toEqual(["TParentRecipient"]);
    });
  });

  describe("framework extra serialization", () => {
    describe("frameworkExtraToRaw", () => {
      it("returns only the converted stake, never the rest of the bag", () => {
        const converted = frameworkExtraToRaw({
          ledgerOpType: "FREEZE",
          stake: { address: "validator", amount: new BigNumber(2_500) },
        }) as Record<string, unknown>;

        expect(converted).toEqual({ stake: { address: "validator", amount: "2500" } });
      });

      it("returns undefined when there is nothing of its own to convert", () => {
        expect(frameworkExtraToRaw({ ledgerOpType: "FREEZE" })).toBeUndefined();
        expect(frameworkExtraToRaw(undefined)).toBeUndefined();
        expect(frameworkExtraToRaw("not-a-bag")).toBeUndefined();
      });

      it("leaves a stake.amount it did not write alone rather than coercing it", () => {
        expect(frameworkExtraToRaw({ stake: { address: "v", amount: 2500 } })).toBeUndefined();
        expect(frameworkExtraToRaw({ stake: { address: "v", amount: "2500" } })).toBeUndefined();
      });
    });

    describe("frameworkExtraFromRaw", () => {
      it("revives the stake amount as a BigNumber", () => {
        const revived = frameworkExtraFromRaw({
          stake: { address: "validator", amount: "2500" },
        }) as Record<string, any>;

        expect(revived).toEqual({
          stake: { address: "validator", amount: new BigNumber(2_500) },
        });
      });

      it("returns undefined for an amount that is not a persisted string", () => {
        expect(frameworkExtraFromRaw({ stake: { address: "v", amount: 2500 } })).toBeUndefined();
        expect(frameworkExtraFromRaw({ ledgerOpType: "FREEZE" })).toBeUndefined();
        expect(frameworkExtraFromRaw(undefined)).toBeUndefined();
      });
    });

    describe("mergeExtra", () => {
      it("layers passthrough, then the family, then the framework's own keys", () => {
        expect(
          mergeExtra({ memo: "kept", frozen: 1, stake: "raw" }, { frozen: 2 }, { stake: "owned" }),
        ).toEqual({ memo: "kept", frozen: 2, stake: "owned" });
      });

      it("keeps the passthrough when the family maps nothing", () => {
        expect(mergeExtra({ memo: "kept" }, undefined, undefined)).toEqual({ memo: "kept" });
      });

      it("falls back to the family's result when the passthrough is not a bag", () => {
        expect(mergeExtra(undefined, { frozen: 1 }, undefined)).toEqual({ frozen: 1 });
        expect(mergeExtra(undefined, undefined, undefined)).toBeUndefined();
      });

      it("creates own properties, so a __proto__ key cannot reach the prototype", () => {
        const merged = mergeExtra({}, JSON.parse('{"__proto__":{"polluted":true}}'), undefined);

        expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      });
    });
  });

  describe("isOperationType", () => {
    it.each(["IN", "OUT", "FEES", "NONE", "DELEGATE", "NFT_IN", "STAKE", "TOP_UP_NEURON"])(
      "returns true for known type %s",
      type => {
        expect(isOperationType(type)).toBe(true);
      },
    );

    it.each(["", "in", "CLAIM_REWARD", "transfer", "unknown_type"])(
      "returns false for unknown string %s",
      type => {
        expect(isOperationType(type)).toBe(false);
      },
    );
  });
});
