import { buildTransactionPayload, encodeToSign } from "@ledgerhq/coin-algorand/buildTransaction";
import { setCoinConfig } from "@ledgerhq/coin-algorand/config";
import * as network from "@ledgerhq/coin-algorand/network";
import type { AlgorandAccount, Transaction } from "@ledgerhq/coin-algorand/types";
import BigNumber from "bignumber.js";
import { toLegacyTransaction } from "./legacyBridgeAdapter";
import type { AlgorandGenericTransaction } from "./types";

jest.mock("@ledgerhq/coin-algorand/network");

const ADDRESS = "AEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEA5RCDXMI";
const common = { family: "algorand" as const, amount: new BigNumber(0), recipient: "" };

function generic(patch: Partial<AlgorandGenericTransaction>): Transaction {
  return { ...common, mode: "send", ...patch } as unknown as Transaction;
}

const legacySend: Transaction = {
  ...common,
  mode: "send",
  recipient: ADDRESS,
  amount: new BigNumber(1000),
  fees: new BigNumber(1000),
  memo: "hello",
  assetId: null,
};

describe("toLegacyTransaction", () => {
  it("maps a generic opt-in to the legacy one", () => {
    expect(
      toLegacyTransaction(
        generic({ mode: "changeTrust", assetReference: "123", assetOwner: ADDRESS }),
      ),
    ).toMatchObject({ mode: "optIn", assetId: "algorand/asa/123" });
  });

  it("copies the generic note into the legacy memo", () => {
    expect(toLegacyTransaction(generic({ memoType: "note", memoValue: "hello" })).memo).toBe(
      "hello",
    );
  });

  it("drops the legacy memo once the generic note is cleared", () => {
    const tx = { ...legacySend, memoValue: undefined } as unknown as Transaction;

    expect(toLegacyTransaction(tx).memo).toBeUndefined();
  });

  it("is idempotent", () => {
    const once = toLegacyTransaction(
      generic({ mode: "changeTrust", assetReference: "123", memoType: "note", memoValue: "hi" }),
    );

    expect(toLegacyTransaction(once)).toEqual(once);
  });

  it("passes a legacy transaction through unchanged", () => {
    expect(toLegacyTransaction(legacySend)).toEqual(legacySend);
  });
});

describe("legacy payload from the generic shape", () => {
  const account = { freshAddress: ADDRESS, subAccounts: [] } as unknown as AlgorandAccount;

  beforeAll(() => {
    setCoinConfig(() => ({ status: { type: "active" }, node: "", indexer: "" }) as never);
    jest.mocked(network.getTransactionParams).mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1,
      lastRound: 2,
      genesisHash: Buffer.alloc(32, 2).toString("base64"),
      genesisID: "mainnet-v1.0",
    });
  });

  async function payload(tx: Transaction): Promise<string> {
    return encodeToSign(await buildTransactionPayload(account, tx));
  }

  it("signs the same opt-in", async () => {
    const legacyOptIn = {
      ...common,
      recipient: ADDRESS,
      mode: "optIn",
      assetId: "algorand/asa/123",
    };
    const genericOptIn = generic({
      recipient: ADDRESS,
      mode: "changeTrust",
      assetReference: "123",
      assetOwner: ADDRESS,
    });

    expect(await payload(toLegacyTransaction(genericOptIn))).toBe(
      await payload(legacyOptIn as Transaction),
    );
  });

  it("signs the same send with a note", async () => {
    const { memo, ...withoutMemo } = legacySend;
    const genericSend = {
      ...withoutMemo,
      memoType: "note",
      memoValue: memo,
    } as unknown as Transaction;

    expect(await payload(toLegacyTransaction(genericSend))).toBe(await payload(legacySend));
  });
});
