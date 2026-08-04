import type { TX } from "@ledgerhq/wallet-btc/index";
import { resolveTransactionDetails, clearTransactionDetailsCache } from "./transaction-details";
import type { TransactionDetailsRequest, TransactionDetailsResult } from "../network/types";

const tx = (overrides: Partial<TX> & Pick<TX, "id">): TX =>
  ({
    account: 0,
    index: 0,
    address: "t1sender",
    received_at: "2026-07-26T12:00:00Z",
    block: { height: 3_426_175, hash: "blockhash", time: "2026-07-26T12:00:00Z" },
    inputs: [],
    outputs: [],
    fees: 0,
    ...overrides,
  }) as TX;

const input = (outputHash: string, index: number, value: string) =>
  ({ value, output_hash: outputHash, output_index: index, sequence: 0 }) as TX["inputs"][number];

/** A t->z send: the explorer folded the 10,000,000 zat that entered the pool into the fee. */
const shieldingSend = tx({
  id: "76ec3b38",
  fees: 10_055_000,
  inputs: [input("2a84cff0", 0, "6191914"), input("d452101f", 0, "5865000")],
});

const resolvesTo = (...results: TransactionDetailsResult[]) =>
  jest.fn(async (_: TransactionDetailsRequest[]) => results);

const priced = "55000";
const payee = "u1recipient";
const ufvk = "uview1account";

beforeEach(() => clearTransactionDetailsCache());

describe("resolveTransactionDetails", () => {
  it("replaces a fee inflated by value that entered the shielded pool", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [] });

    const { transactions } = await resolveTransactionDetails([shieldingSend], resolve);

    expect(transactions[0].fees).toBe(55_000);
  });

  it("reports the shielded payee, which no transparent output names", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [payee] });

    const { payeesByTxId } = await resolveTransactionDetails([shieldingSend], resolve, ufvk);

    expect(payeesByTxId.get("76ec3b38")).toEqual([payee]);
  });

  it("reports no payee for a transaction that pays no shielded address", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [] });

    const { payeesByTxId } = await resolveTransactionDetails([shieldingSend], resolve, ufvk);

    expect(payeesByTxId.size).toBe(0);
  });

  it("asks for every transparent input as a prevout, keyed by the spent output", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [] });

    await resolveTransactionDetails([shieldingSend], resolve);

    expect(resolve).toHaveBeenCalledWith([
      {
        txid: "76ec3b38",
        height: 3_426_175,
        prevouts: [
          { txid: "2a84cff0", index: 0, value: "6191914" },
          { txid: "d452101f", index: 0, value: "5865000" },
        ],
      },
    ] satisfies TransactionDetailsRequest[]);
  });

  it("resolves a deshielding send, which has no transparent inputs at all", async () => {
    const receive = tx({ id: "932c99c7", fees: 0 });
    const resolve = resolvesTo({ txid: "932c99c7", fee: "15000", payees: [] });

    const { transactions } = await resolveTransactionDetails([receive], resolve);

    expect(resolve.mock.calls[0][0]).toEqual([
      { txid: "932c99c7", height: 3_426_175, prevouts: [] },
    ]);
    expect(transactions[0].fees).toBe(15_000);
  });

  // A fee we cannot establish must not be reported as zero, which would be a
  // stronger claim than the explorer's guess.
  it("keeps the reported fee when the chain cannot establish one", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: null, payees: [] });

    const { transactions } = await resolveTransactionDetails([shieldingSend], resolve);

    expect(transactions[0].fees).toBe(10_055_000);
  });

  it("still reports the payee of a transaction whose fee is unknown", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: null, payees: [payee] });

    const { payeesByTxId } = await resolveTransactionDetails([shieldingSend], resolve, ufvk);

    expect(payeesByTxId.get("76ec3b38")).toEqual([payee]);
  });

  // Writing a fee we cannot read as a number would carry NaN into the operation
  // value and the balance, where it is far harder to trace than a stale fee.
  it("keeps the reported fee when the chain answers with something unreadable", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: "not-a-number", payees: [] });

    const { transactions } = await resolveTransactionDetails([shieldingSend], resolve);

    expect(transactions[0].fees).toBe(10_055_000);
  });

  it("keeps everything the explorer reported when the lookup itself fails", async () => {
    const resolve = jest.fn(async (_: TransactionDetailsRequest[]) => {
      throw new Error("gRPC unreachable");
    });

    const { transactions, payeesByTxId } = await resolveTransactionDetails(
      [shieldingSend],
      resolve,
    );

    expect(transactions[0].fees).toBe(10_055_000);
    expect(payeesByTxId.size).toBe(0);
  });

  it("does not ask about unconfirmed transactions, which have no block to parse against", async () => {
    const resolve = resolvesTo();

    await resolveTransactionDetails([tx({ id: "pending", block: null })], resolve);

    expect(resolve).not.toHaveBeenCalled();
  });

  it("does not ask about a coinbase input, whose prevout value cannot be looked up", async () => {
    const resolve = resolvesTo();
    const coinbase = tx({
      id: "coinbase",
      inputs: [{ value: "0", output_index: 4_294_967_295, sequence: 0 } as TX["inputs"][number]],
    });

    await resolveTransactionDetails([coinbase], resolve);

    expect(resolve).not.toHaveBeenCalled();
  });

  it("resolves a transaction once and reuses the answer on later passes", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [payee] });

    await resolveTransactionDetails([shieldingSend], resolve, ufvk);
    const { transactions, payeesByTxId } = await resolveTransactionDetails(
      [shieldingSend],
      resolve,
      ufvk,
    );

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(transactions[0].fees).toBe(55_000);
    expect(payeesByTxId.get("76ec3b38")).toEqual([payee]);
  });

  // An account has no viewing key on its very first sync: the key is what the
  // shielded sync establishes. Remembering that first, payee-less answer as
  // final would leave the destination showing a change address for good.
  it("asks again for the payees of a transaction it resolved before knowing the viewing key", async () => {
    const resolve = jest
      .fn<Promise<TransactionDetailsResult[]>, [TransactionDetailsRequest[]]>()
      .mockResolvedValueOnce([{ txid: "76ec3b38", fee: priced, payees: [] }])
      .mockResolvedValueOnce([{ txid: "76ec3b38", fee: priced, payees: [payee] }]);

    await resolveTransactionDetails([shieldingSend], resolve);
    const { payeesByTxId } = await resolveTransactionDetails([shieldingSend], resolve, ufvk);

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(payeesByTxId.get("76ec3b38")).toEqual([payee]);
  });

  // Payees only exist relative to the key they were recovered with: the account
  // that sent a transaction sees who it paid, another account sees nothing.
  it("does not answer one account with the payees recovered for another", async () => {
    const resolve = jest
      .fn<Promise<TransactionDetailsResult[]>, [TransactionDetailsRequest[]]>()
      .mockResolvedValueOnce([{ txid: "76ec3b38", fee: priced, payees: [payee] }])
      .mockResolvedValueOnce([{ txid: "76ec3b38", fee: priced, payees: [] }]);

    await resolveTransactionDetails([shieldingSend], resolve, ufvk);
    const { payeesByTxId } = await resolveTransactionDetails(
      [shieldingSend],
      resolve,
      "uview1other",
    );

    expect(payeesByTxId.size).toBe(0);
  });

  // Distinguishes a transient failure from a settled answer: a transaction that
  // could not be reached is not remembered as unresolvable.
  it("retries a transaction the endpoint could not resolve", async () => {
    const resolve = jest
      .fn<Promise<TransactionDetailsResult[]>, [TransactionDetailsRequest[]]>()
      .mockRejectedValueOnce(new Error("gRPC unreachable"))
      .mockResolvedValueOnce([{ txid: "76ec3b38", fee: priced, payees: [] }]);

    await resolveTransactionDetails([shieldingSend], resolve);
    const { transactions } = await resolveTransactionDetails([shieldingSend], resolve);

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(transactions[0].fees).toBe(55_000);
  });

  it("asks about a repeated transaction only once per batch", async () => {
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [] });

    await resolveTransactionDetails([shieldingSend, shieldingSend], resolve);

    expect(resolve.mock.calls[0][0]).toHaveLength(1);
  });

  it("leaves transactions it did not resolve untouched", async () => {
    const other = tx({ id: "untouched", fees: 1_234 });
    const resolve = resolvesTo({ txid: "76ec3b38", fee: priced, payees: [] });

    const { transactions } = await resolveTransactionDetails([shieldingSend, other], resolve);

    expect(transactions[1].fees).toBe(1_234);
  });
});
