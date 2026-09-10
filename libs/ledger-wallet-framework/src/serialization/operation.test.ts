import BigNumber from "bignumber.js";
import Prando from "prando";
import { Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "../types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genOperation } from "../mocks/account";
import {
  buildSubOperationIndex,
  fromOperationRaw,
  inferSubOperations,
  toOperationRaw,
} from "./operation";

const ethereum = getCryptoCurrencyById("ethereum") as unknown as CryptoCurrency;
const stellar = getCryptoCurrencyById("stellar") as unknown as CryptoCurrency;

describe("Operation.ts", () => {
  describe("convert from/to Operation", () => {
    const accountEth = genAccount("myAccount", { currency: ethereum });
    const accountStellar = genAccount("myAccount", { currency: stellar });

    const baseEthOperation = {
      ...genOperation(accountEth, accountEth, accountEth.operations, new Prando("")),
      transactionSequenceNumber: new BigNumber(1),
    };

    const baseStellarOperation = {
      id: "js:2:stellar:GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J:sep5-10ef79fc46d2da31aafe0ea68e7a435b1e274f6a12e88b7533feaacd89fa7c8d-IN",
      hash: "10ef79fc46d2da31aafe0ea68e7a435b1e274f6a12e88b7533feaacd89fa7c8d",
      type: "IN" as OperationType,
      senders: ["GAVITYOI5M6WGPVYP2KNZ44TVXCODDCDZP3S3N6LHOZQXCAA4J4WLMQX"],
      recipients: ["GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J"],
      accountId: "js:2:stellar:GBAMU3EJX6KLW2JEIAIEAYNLPKHFPJR6OYQYX5HPYB3CVQ6QD4XUJ23J:sep5",
      blockHash: "2fa331926c855cc2f8013019d8b1d37c93b585aa1ed871dcf3b3c08380cc240e",
      blockHeight: 59516845,
      extra: { memo: { type: "MEMO_TEXT", value: "Buy XEN Earn Native XLM!" } },
      date: "2025-10-23T17:44:23.000Z",
      value: "1",
      fee: "10000",
      transactionSequenceNumber: 255106510328181600,
      hasFailed: false,
    };

    const commonDate = new Date(1986, 0, 1).toString();

    const createOperation = (overrides: any) => ({
      ...baseEthOperation,
      subOperations: [],
      internalOperations: [],
      nftOperations: [],
      value: "1",
      fee: "1",
      date: commonDate,
      ...overrides,
    });

    it("converts operation → raw (with sequence number)", () => {
      const testAccount = { ...accountEth, operations: [baseEthOperation] };
      const raw = toOperationRaw(testAccount.operations[0]);
      expect(raw.transactionSequenceNumber).toEqual("1");
    });

    it("converts operation → raw (undefined sequence number)", () => {
      const testAccount = {
        ...accountEth,
        operations: [{ ...baseEthOperation, transactionSequenceNumber: undefined }],
      };
      const raw = toOperationRaw(testAccount.operations[0]);
      expect(raw.transactionSequenceNumber).toBeUndefined();
    });

    it("converts raw → operation (valid numeric string)", () => {
      const testAccount = {
        ...accountEth,
        operations: [createOperation({ transactionSequenceNumber: "1" })],
      };
      const op = fromOperationRaw(testAccount.operations[0], testAccount.id);
      expect(op.transactionSequenceNumber).toEqual(new BigNumber(1));
    });

    it("converts raw → operation (NaN sequence string)", () => {
      const testAccount = {
        ...accountEth,
        operations: [createOperation({ transactionSequenceNumber: "undefined" })],
      };
      const op = fromOperationRaw(testAccount.operations[0], testAccount.id);
      expect(op.transactionSequenceNumber).toBeUndefined();
    });

    it("converts raw → operation (undefined sequence number)", () => {
      const testAccount = {
        ...accountEth,
        operations: [createOperation({ transactionSequenceNumber: undefined })],
      };
      // Need to cast as any so we can test undefined which is not in type OperationRaw
      const op = fromOperationRaw(testAccount.operations[0] as any, testAccount.id);
      expect(op.transactionSequenceNumber).toBeUndefined();
    });

    it("converts Stellar raw → operation (numeric sequence number)", () => {
      const testAccount = { ...accountStellar, operations: [baseStellarOperation] };
      // Since we change the type of transactionSequenceNumber from number to string
      // we need to cast as any so we can test number which is not in type OperationRaw
      // in order to test migration of users for LIVE-XXXX, since it started exceeding the MAX_INTEGER_LIMIT
      const op = fromOperationRaw(testAccount.operations[0] as any, testAccount.id);
      expect(op.transactionSequenceNumber).toEqual(new BigNumber(255106510328181600));
    });
  });

  describe("buildSubOperationIndex", () => {
    // Minimal Operation fixtures: only the fields inferSubOperations/buildSubOperationIndex read
    // (id, hash) matter for these tests; the rest is filled with harmless placeholders.
    const makeOperation = (id: string, hash: string): Operation =>
      ({
        id,
        hash,
        type: "IN",
        value: new BigNumber(0),
        fee: new BigNumber(0),
        senders: [],
        recipients: [],
        accountId: id,
        blockHeight: null,
        blockHash: null,
        date: new Date(0),
        extra: {},
      }) as unknown as Operation;

    const makeTokenAccount = (
      id: string,
      operations: Operation[],
      pendingOperations: Operation[] = [],
    ): TokenAccount =>
      ({
        type: "TokenAccount",
        id,
        parentId: "parent",
        operations,
        pendingOperations,
      }) as unknown as TokenAccount;

    // sub-account 0: two confirmed ops sharing hash "h1", one pending op also on "h1"
    const subAccount0 = makeTokenAccount(
      "sub0",
      [makeOperation("sub0-op-h1", "h1"), makeOperation("sub0-op-h2", "h2")],
      [makeOperation("sub0-pending-h1", "h1")],
    );
    // sub-account 1: one confirmed op on "h1" (same hash as sub-account 0), one pending-only hash "h4"
    const subAccount1 = makeTokenAccount(
      "sub1",
      [makeOperation("sub1-op-h1", "h1"), makeOperation("sub1-op-h3", "h3")],
      [makeOperation("sub1-pending-h4", "h4")],
    );
    const subAccounts = [subAccount0, subAccount1];
    const allHashes = ["h1", "h2", "h3", "h4", "h-missing"];

    it("is deep-equal to inferSubOperations for every hash present, order included", () => {
      const index = buildSubOperationIndex(subAccounts);
      for (const hash of allHashes) {
        expect(index.get(hash) ?? []).toEqual(inferSubOperations(hash, subAccounts));
      }
    });

    it("orders an operation from sub-account 0 before one from sub-account 1", () => {
      const index = buildSubOperationIndex(subAccounts);
      const forH1 = index.get("h1") ?? [];
      expect(forH1.map(op => op.id)).toEqual(["sub0-op-h1", "sub0-pending-h1", "sub1-op-h1"]);
    });

    it("orders a sub-account's pendingOperations entry after its own operations entries", () => {
      const index = buildSubOperationIndex(subAccounts);
      const forH1 = index.get("h1") ?? [];
      const opIndex = forH1.findIndex(op => op.id === "sub0-op-h1");
      const pendingIndex = forH1.findIndex(op => op.id === "sub0-pending-h1");
      expect(opIndex).toBeLessThan(pendingIndex);
    });

    it("collects a hash present only in pendingOperations", () => {
      const index = buildSubOperationIndex(subAccounts);
      expect(index.get("h4")?.map(op => op.id)).toEqual(["sub1-pending-h4"]);
    });

    it("yields [] rather than undefined for a hash absent everywhere, via the ?? [] fallback", () => {
      const index = buildSubOperationIndex(subAccounts);
      expect(index.get("h-missing") ?? []).toEqual([]);
    });

    it("fromOperationRaw with the index matches fromOperationRaw without it", () => {
      const rawOp = {
        id: "parent-op",
        hash: "h1",
        type: "IN" as OperationType,
        senders: [],
        recipients: [],
        accountId: "parent",
        date: new Date(0).toISOString(),
        value: "0",
        fee: "0",
        blockHeight: 1,
        blockHash: "b1",
        extra: {},
      };
      const index = buildSubOperationIndex(subAccounts);

      const withIndex = fromOperationRaw(rawOp, "parent", subAccounts, undefined, index);
      const withoutIndex = fromOperationRaw(rawOp, "parent", subAccounts);

      expect(withIndex.subOperations?.map(op => op.id)).toEqual(
        withoutIndex.subOperations?.map(op => op.id),
      );
      expect(withIndex).toEqual(withoutIndex);
    });

    it("still scans with the existing four-argument form when no index is supplied", () => {
      const rawOp = {
        id: "parent-op",
        hash: "h1",
        type: "IN" as OperationType,
        senders: [],
        recipients: [],
        accountId: "parent",
        date: new Date(0).toISOString(),
        value: "0",
        fee: "0",
        blockHeight: 1,
        blockHash: "b1",
        extra: {},
      };

      const op = fromOperationRaw(rawOp, "parent", subAccounts, undefined);
      expect(op.subOperations?.map(o => o.id)).toEqual([
        "sub0-op-h1",
        "sub0-pending-h1",
        "sub1-op-h1",
      ]);
    });
  });
});
