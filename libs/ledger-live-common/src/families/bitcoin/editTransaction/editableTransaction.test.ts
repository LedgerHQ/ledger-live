import type { Account, Operation } from "@ledgerhq/types-live";
import { bitcoinPickingStrategy, type TransactionRaw } from "../types";
import { getEditableTransactionRaw } from "./editableTransaction";

const mainAccount = { freshAddress: "bc1qfresh" } as Account;

const operation = (hash: string, transactionRaw?: TransactionRaw): Operation =>
  ({
    id: `op-${hash}`,
    hash,
    type: "OUT",
    ...(transactionRaw ? { transactionRaw } : {}),
  }) as unknown as Operation;

describe("getEditableTransactionRaw", () => {
  it("starts from the transaction the operation was sent with, replacing it", () => {
    const transactionRaw: TransactionRaw = {
      family: "bitcoin",
      amount: "50000",
      recipient: "bc1qrecipient",
      feesStrategy: "medium",
      familySpecificData: {
        rbf: true,
        feePerByte: "12",
        utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
      },
    };

    expect(getEditableTransactionRaw(operation("send-hash", transactionRaw), mainAccount)).toEqual({
      ...transactionRaw,
      familySpecificData: { ...transactionRaw.familySpecificData, replaceTxId: "send-hash" },
    });
  });

  it("replaces the operation itself, never the transaction a stored replaceTxId points to", () => {
    // re-cancelling a cancel must beat the cancel, not the original send
    const cancelRaw: TransactionRaw = {
      family: "bitcoin",
      amount: "50000",
      recipient: "bc1qchange",
      familySpecificData: { rbf: true, replaceTxId: "send-hash", changeAddress: "bc1qchange" },
    };

    const result = getEditableTransactionRaw(operation("cancel-hash", cancelRaw), mainAccount);

    expect(result.familySpecificData).toEqual({
      rbf: true,
      replaceTxId: "cancel-hash",
      changeAddress: "bc1qchange",
    });
    // the operation's own transaction is not mutated
    expect(cancelRaw.familySpecificData?.replaceTxId).toBe("send-hash");
  });

  it("converts a transaction the legacy bridge stored, assumed replaceable", () => {
    const legacyRaw = {
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
      feesStrategy: "fast",
      utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
      rbf: false,
      feePerByte: "21",
      networkInfo: { family: "bitcoin", feeItems: { items: [], defaultFeePerByte: "1" } },
      opReturnData: { type: "Buffer", data: [0x68, 0x69] },
      changeAddress: "bc1qchange",
      replaceTxId: "older-hash",
    } as unknown as TransactionRaw;

    expect(getEditableTransactionRaw(operation("send-hash", legacyRaw), mainAccount)).toEqual({
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
      feesStrategy: "fast",
      familySpecificData: {
        rbf: true,
        utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
        feePerByte: "21",
        opReturnData: "6869",
        changeAddress: "bc1qchange",
        replaceTxId: "send-hash",
      },
    });
  });

  it.each([
    ["a hex string", "6869", "6869"],
    ["a Buffer", Buffer.from("hi"), "6869"],
    ["an empty string", "", undefined],
    ["an empty Buffer", { type: "Buffer", data: [] }, undefined],
    ["anything else", 42, undefined],
    ["null", null, undefined],
  ])("reads legacy OP_RETURN data given as %s", (_label, opReturnData, expected) => {
    const legacyRaw = {
      family: "bitcoin",
      amount: "0",
      recipient: "r",
      opReturnData,
    } as unknown as TransactionRaw;
    expect(
      getEditableTransactionRaw(operation("h", legacyRaw), mainAccount).familySpecificData
        ?.opReturnData,
    ).toBe(expected);
  });

  it("converts a bare legacy transaction to a replaceable one", () => {
    const transactionRaw: TransactionRaw = {
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
    };

    expect(
      getEditableTransactionRaw(operation("send-hash", transactionRaw), mainAccount)
        .familySpecificData,
    ).toEqual({ rbf: true, replaceTxId: "send-hash" });
  });

  it("builds a minimal replaceable transaction for an operation without one (synced only)", () => {
    expect(getEditableTransactionRaw(operation("synced-hash"), mainAccount)).toEqual({
      family: "bitcoin",
      amount: "0",
      recipient: "bc1qfresh",
      familySpecificData: {
        rbf: true,
        utxoStrategy: { strategy: bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST, excludeUTXOs: [] },
        replaceTxId: "synced-hash",
      },
    });
  });
});
