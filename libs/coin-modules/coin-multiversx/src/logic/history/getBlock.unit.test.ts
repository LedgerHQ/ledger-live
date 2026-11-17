import { ESDT_SYSTEM_SC_BECH32 } from "../../constants";
import { MultiversXRoundNotFinal } from "../../errors";
import type { MultiversXNetworkApi } from "../../network/api";
import type { MultiversXApiTransaction, MultiversXTransactionOperation } from "../../types";
import { getBlock } from "./getBlock";

const ROUND = 40045794;
const ALICE = "erd1qxae079av6p2xnklfkc90tl4kwqk47u0hwwz3mp3gzx2q654zy0scphk9s";
const BOB = "erd1axqs2gpka9dzkdwj986z3umgusvnlmfejudj9hk0r89l28spgrjq0uuyf6";
const RELAYER = "erd1gxmagk0zujd92yj7y23pre5s49r4wm754wnzwsl3lhy0n9skv0ys5dt3x2";
const CONTRACT = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3";

const NATIVE = { type: "native" };
const WEGLD = { type: "esdt", assetReference: "WEGLD-bd4d79", assetOwner: ESDT_SYSTEM_SC_BECH32 };

function transaction(fields: Record<string, unknown>): MultiversXApiTransaction {
  return {
    txHash: "TX",
    sender: ALICE,
    receiver: BOB,
    value: "0",
    fee: "50000000000000",
    status: "success",
    round: ROUND,
    ...fields,
  } as unknown as MultiversXApiTransaction;
}

function operation(
  fields: Partial<MultiversXTransactionOperation>,
): MultiversXTransactionOperation {
  return { action: "transfer", type: "egld", sender: ALICE, receiver: BOB, ...fields };
}

function makeApi(transactions: MultiversXApiTransaction[]) {
  return {
    getRound: jest.fn().mockResolvedValue({
      round: ROUND,
      timestamp: 1793796445,
      timestampMs: 1793796445800,
    }),
    getRoundTransactions: jest.fn().mockResolvedValue(transactions),
  };
}

async function blockOf(...transactions: MultiversXApiTransaction[]) {
  return getBlock(makeApi(transactions) as unknown as MultiversXNetworkApi, ROUND);
}

describe("getBlock", () => {
  it("returns the round info and fetches the round transactions", async () => {
    const api = makeApi([]);

    const block = await getBlock(api as unknown as MultiversXNetworkApi, ROUND);

    expect(api.getRound).toHaveBeenCalledWith(ROUND);
    expect(api.getRoundTransactions).toHaveBeenCalledWith(ROUND);
    expect(block).toEqual({
      info: { height: ROUND, hash: String(ROUND), time: new Date(1793796445800) },
      transactions: [],
    });
  });

  it("maps a native transfer to a debit and a credit, with the sender paying the fees", async () => {
    const block = await blockOf(transaction({ txHash: "NATIVE", value: "1000" }));

    expect(block.transactions).toEqual([
      {
        hash: "NATIVE",
        failed: false,
        operations: [
          { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -1000n },
          { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 1000n },
        ],
        fees: 50000000000000n,
        feesPayer: ALICE,
      },
    ]);
  });

  it("adds the transaction value to the transfers made by the smart contract", async () => {
    const block = await blockOf(
      transaction({
        receiver: CONTRACT,
        value: "907",
        operations: [
          operation({
            action: "localMint",
            type: "esdt",
            identifier: "WEGLD-bd4d79",
            sender: CONTRACT,
            receiver: CONTRACT,
            value: "907",
          }),
          operation({
            type: "esdt",
            identifier: "WEGLD-bd4d79",
            sender: CONTRACT,
            receiver: ALICE,
            value: "907",
          }),
        ],
      }),
    );

    expect(block.transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: CONTRACT, asset: NATIVE, amount: -907n },
      { type: "transfer", address: CONTRACT, peer: ALICE, asset: NATIVE, amount: 907n },
      { type: "transfer", address: CONTRACT, asset: WEGLD, amount: 907n },
      { type: "transfer", address: CONTRACT, peer: ALICE, asset: WEGLD, amount: -907n },
      { type: "transfer", address: ALICE, peer: CONTRACT, asset: WEGLD, amount: 907n },
    ]);
  });

  it("maps the native EGLD a smart contract sends back and the tokens it burns", async () => {
    const block = await blockOf(
      transaction({
        receiver: CONTRACT,
        operations: [
          operation({
            type: "esdt",
            identifier: "WEGLD-bd4d79",
            sender: ALICE,
            receiver: CONTRACT,
            value: "50",
          }),
          operation({
            action: "localBurn",
            type: "esdt",
            identifier: "WEGLD-bd4d79",
            sender: CONTRACT,
            receiver: CONTRACT,
            value: "50",
          }),
          operation({ type: "egld", sender: CONTRACT, receiver: ALICE, value: "50" }),
        ],
      }),
    );

    expect(block.transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: CONTRACT, asset: WEGLD, amount: -50n },
      { type: "transfer", address: CONTRACT, peer: ALICE, asset: WEGLD, amount: 50n },
      { type: "transfer", address: CONTRACT, asset: WEGLD, amount: -50n },
      { type: "transfer", address: CONTRACT, peer: ALICE, asset: NATIVE, amount: -50n },
      { type: "transfer", address: ALICE, peer: CONTRACT, asset: NATIVE, amount: 50n },
    ]);
  });

  it("maps EGLD sent through a multi-token transfer as native and NFTs by their identifier", async () => {
    const block = await blockOf(
      transaction({
        receiver: ALICE,
        operations: [
          operation({ type: "esdt", identifier: "EGLD-000000", value: "5" }),
          operation({ type: "nft", identifier: "EAPES-8f3c1f-0919", value: "1" }),
        ],
      }),
    );

    const nft = {
      type: "esdt",
      assetReference: "EAPES-8f3c1f-0919",
      assetOwner: ESDT_SYSTEM_SC_BECH32,
    };
    expect(block.transactions[0].operations).toEqual([
      { type: "transfer", address: ALICE, peer: BOB, asset: NATIVE, amount: -5n },
      { type: "transfer", address: BOB, peer: ALICE, asset: NATIVE, amount: 5n },
      { type: "transfer", address: ALICE, peer: BOB, asset: nft, amount: -1n },
      { type: "transfer", address: BOB, peer: ALICE, asset: nft, amount: 1n },
    ]);
  });

  it("ignores logs, errors, zero transfers and operations of an unknown asset", async () => {
    const block = await blockOf(
      transaction({
        operations: [
          operation({ action: "writeLog", type: "log" }),
          operation({ action: "signalError", type: "error" }),
          operation({ type: "esdt", identifier: "WEGLD-bd4d79", value: "0" }),
          operation({ type: "scr", value: "10" }),
          operation({ type: "esdt", value: "10" }),
        ],
      }),
    );

    expect(block.transactions[0].operations).toEqual([]);
  });

  it("makes the relayer of a relayed transaction pay the fees", async () => {
    const block = await blockOf(transaction({ relayer: RELAYER }));

    expect(block.transactions[0].feesPayer).toBe(RELAYER);
  });

  it("credits a protocol reward to its receiver, without fees or fee payer", async () => {
    const block = await blockOf(
      transaction({ txHash: "REWARD", sender: "4294967295", value: "528", fee: null }),
    );

    expect(block.transactions).toEqual([
      {
        hash: "REWARD",
        failed: false,
        operations: [{ type: "transfer", address: BOB, asset: NATIVE, amount: 528n }],
        fees: 0n,
      },
    ]);
  });

  it.each(["fail", "invalid", undefined])(
    "keeps the fees of a transaction with status %s but none of its transfers",
    async status => {
      const block = await blockOf(
        transaction({
          status,
          value: "1000",
          fee: "966010000000000",
          operations: [operation({ value: "1000" })],
        }),
      );

      expect(block.transactions).toEqual([
        { hash: "TX", failed: true, operations: [], fees: 966010000000000n, feesPayer: ALICE },
      ]);
    },
  );

  it("rejects a round with a pending transaction, so it is read again once final", async () => {
    await expect(
      blockOf(transaction({ txHash: "DONE" }), transaction({ txHash: "WAIT", status: "pending" })),
    ).rejects.toThrow(
      new MultiversXRoundNotFinal(
        `MultiversX round ${ROUND} is not final: transaction WAIT is pending`,
      ),
    );
  });

  it.each([-1, 1.5, Number.NaN])(
    "rejects the invalid height %s without calling the API",
    async height => {
      const api = makeApi([]);

      await expect(getBlock(api as unknown as MultiversXNetworkApi, height)).rejects.toThrow(
        `MultiversX block height must be a non-negative integer, got ${height}`,
      );
      expect(api.getRound).not.toHaveBeenCalled();
      expect(api.getRoundTransactions).not.toHaveBeenCalled();
    },
  );
});
