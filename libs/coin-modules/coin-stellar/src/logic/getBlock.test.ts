import type { Horizon } from "@stellar/stellar-sdk";
import BigNumber from "bignumber.js";
import * as horizon from "../network/horizon";
import type { RawOperation } from "../types";
import { parseAPIValue } from "./common";
import { getBlock } from "./getBlock";

jest.mock("../network/horizon", () => ({
  ...jest.requireActual<typeof import("../network/horizon")>("../network/horizon"),
  fetchLedgerRecord: jest.fn(),
  fetchAllLedgerOperations: jest.fn(),
}));

const fetchLedgerRecordMock = horizon.fetchLedgerRecord as jest.MockedFunction<
  typeof horizon.fetchLedgerRecord
>;
const fetchAllLedgerOperationsMock = horizon.fetchAllLedgerOperations as jest.MockedFunction<
  typeof horizon.fetchAllLedgerOperations
>;

function txRecord(
  overrides: Partial<Horizon.ServerApi.TransactionRecord> = {},
): Horizon.ServerApi.TransactionRecord {
  return {
    fee_charged: "100",
    source_account: "GSOURCEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    fee_account: undefined,
    ledger_attr: 42,
    memo_type: "none",
    ...overrides,
  } as Horizon.ServerApi.TransactionRecord;
}

function rawOp(
  base: Record<string, unknown> & {
    type: string;
    transaction_hash: string;
    transactionRecord?: Horizon.ServerApi.TransactionRecord;
  },
): RawOperation {
  const tr = base.transactionRecord ?? txRecord();
  const { transactionRecord: _t, ...rest } = base;
  return {
    id: "1",
    paging_token: "pt",
    source_account: "GSOURCEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    transaction_successful: true,
    created_at: "2020-01-01T00:00:00Z",
    ...rest,
    transaction: () => Promise.resolve(tr),
  } as RawOperation;
}

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchLedgerRecordMock.mockImplementation(async (seq: number) =>
      ({
        sequence: seq,
        hash: `LEDGER-HASH-${seq}`,
        closed_at: "2018-09-15T15:40:05Z",
      }) as Awaited<ReturnType<typeof horizon.fetchLedgerRecord>>,
    );
  });

  describe("height validation", () => {
    it("rejects height 0", async () => {
      await expect(getBlock(0)).rejects.toThrow("getBlock: height must be a positive integer, got 0");
    });

    it("rejects negative height", async () => {
      await expect(getBlock(-1)).rejects.toThrow("getBlock: height must be a positive integer, got -1");
    });

    it("rejects non-integer height", async () => {
      await expect(getBlock(2.5)).rejects.toThrow("getBlock: height must be a positive integer, got 2.5");
    });

    it("rejects NaN", async () => {
      await expect(getBlock(Number.NaN)).rejects.toThrow("getBlock: height must be a positive integer, got NaN");
    });

    it("rejects Infinity", async () => {
      await expect(getBlock(Number.POSITIVE_INFINITY)).rejects.toThrow(
        "getBlock: height must be a positive integer, got Infinity",
      );
    });
  });

  it("maps a native payment with two transfer operations", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txpay1",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "1.0000000",
        asset_type: "native",
        transactionRecord: txRecord({ fee_charged: "200" }),
      }),
    ]);

    const block = await getBlock(20000000);

    expect(block.info.height).toBe(20000000);
    expect(block.info.hash).toBe("LEDGER-HASH-20000000");
    expect(block.info.parent).toEqual({
      height: 19999999,
      hash: "LEDGER-HASH-19999999",
    });

    expect(block.transactions).toHaveLength(1);
    const tx0 = block.transactions[0];
    expect(tx0.hash).toBe("txpay1");
    expect(tx0.failed).toBe(false);
    expect(tx0.fees).toBe(200n);
    expect(tx0.feesPayer).toBe("GSOURCEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(tx0.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "transfer",
          address: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          amount: -10000000n,
        }),
        expect.objectContaining({
          type: "transfer",
          address: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          amount: 10000000n,
        }),
      ]),
    );
  });

  it("uses fee_account as feesPayer when present (fee bump)", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txfeebump",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "2.0000000",
        asset_type: "native",
        transactionRecord: txRecord({
          fee_charged: "500",
          source_account: "GINNERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          fee_account: "GFEEPAYERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        }),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].feesPayer).toBe("GFEEPAYERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  });

  it("marks failed transactions with empty operations but keeps fees", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txfail",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "1.0000000",
        asset_type: "native",
        transaction_successful: false,
        transactionRecord: txRecord({ fee_charged: "400" }),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0]).toMatchObject({
      hash: "txfail",
      failed: true,
      fees: 400n,
      operations: [],
    });
  });

  it("groups multiple allowlisted operations under the same transaction hash", async () => {
    const sharedTx = txRecord({ fee_charged: "300" });
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        id: "1",
        type: "payment",
        transaction_hash: "txmulti",
        from: "GA",
        to: "GB",
        amount: "1.0000000",
        asset_type: "native",
        transactionRecord: sharedTx,
      }),
      rawOp({
        id: "2",
        type: "payment",
        transaction_hash: "txmulti",
        from: "GB",
        to: "GC",
        amount: "0.5000000",
        asset_type: "native",
        transactionRecord: sharedTx,
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions).toHaveLength(1);
    expect(block.transactions[0].operations.length).toBeGreaterThanOrEqual(2);
  });

  it("maps token payments using assetReference and assetOwner", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txtok",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "10.0000000",
        asset_type: "credit_alphanum4",
        asset_code: "USD",
        asset_issuer: "GISSUERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    const transfers = block.transactions[0].operations.filter(o => o.type === "transfer");
    expect(transfers[0]).toMatchObject({
      asset: { type: "token", assetReference: "USD", assetOwner: "GISSUERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" },
    });
  });

  it("maps create_account to two native transfers", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "create_account",
        transaction_hash: "txcreate",
        funder: "GFUNDERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        account: "GNEWACCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        starting_balance: "2.0000000",
        transactionRecord: txRecord({ fee_charged: "100" }),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "transfer",
          address: "GFUNDERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          amount: -20000000n,
        }),
        expect.objectContaining({
          type: "transfer",
          address: "GNEWACCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          amount: 20000000n,
        }),
      ]),
    );
  });

  it("maps change_trust to other operations", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "change_trust",
        transaction_hash: "txtrust",
        trustor: "GTRUSTORAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        asset_code: "ABC",
        asset_issuer: "GISSUERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        limit: "1000.0000000",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations[0]).toMatchObject({
      type: "other",
      ledgerOpType: "OPT_IN",
      trustor: "GTRUSTORAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    });
  });

  it("omits successful transactions that only contain unsupported operation types", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "manage_sell_offer",
        transaction_hash: "txoffer",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions).toHaveLength(0);
  });

  it("maps path_payment_strict_send with distinct source and destination assets", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_send",
        transaction_hash: "txpathsend",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.0033586",
        asset_type: "credit_alphanum12",
        asset_code: "Shitcoinz",
        asset_issuer: "GBVYKIM4QGW7NK3Q5S76GWMZMLAWYB6FB43JQ4J7ZOXHAA3LEZZGYHSD",
        source_amount: "0.0130225",
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    const ops = block.transactions[0].operations;
    expect(ops).toHaveLength(2);
    expect(ops[0]).toMatchObject({ type: "transfer", asset: { type: "native" }, amount: expect.any(BigInt) });
    expect(ops[1]).toMatchObject({
      type: "transfer",
      asset: { type: "token", assetReference: "Shitcoinz" },
      amount: expect.any(BigInt),
    });
  });

  it("path_payment_strict_receive debits source_amount when both send_max and source_amount are present", async () => {
    const sourceAmountStr = "0.0100000";
    const sendMaxStr = "5.0000000";
    const expectedDebit = BigInt(
      parseAPIValue(sourceAmountStr).integerValue(BigNumber.ROUND_FLOOR).toFixed(0),
    );

    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_receive",
        transaction_hash: "txpathrecv",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.0033586",
        asset_type: "credit_alphanum12",
        asset_code: "Shitcoinz",
        asset_issuer: "GBVYKIM4QGW7NK3Q5S76GWMZMLAWYB6FB43JQ4J7ZOXHAA3LEZZGYHSD",
        send_max: sendMaxStr,
        source_amount: sourceAmountStr,
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    const ops = block.transactions[0].operations;
    expect(ops).toHaveLength(2);
    expect(ops[0]).toMatchObject({
      type: "transfer",
      address: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      asset: { type: "native" },
      amount: -expectedDebit,
    });
    const wrongDebit = BigInt(parseAPIValue(sendMaxStr).integerValue(BigNumber.ROUND_FLOOR).toFixed(0));
    expect(ops[0].amount).not.toBe(-wrongDebit);
  });

  it("omits parent in block info for ledger height 1", async () => {
    fetchLedgerRecordMock.mockImplementation(async (seq: number) =>
      ({
        sequence: seq,
        hash: `LEDGER-HASH-${seq}`,
        closed_at: "2018-09-15T15:40:05Z",
      }) as Awaited<ReturnType<typeof horizon.fetchLedgerRecord>>,
    );
    fetchAllLedgerOperationsMock.mockResolvedValue([]);

    const block = await getBlock(1);
    expect(block.info.height).toBe(1);
    expect(block.info.parent).toBeUndefined();
  });

  it("omits feesPayer when fee_account and source_account are absent", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txnopayer",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "1.0000000",
        asset_type: "native",
        transactionRecord: txRecord({
          fee_charged: "100",
          source_account: "",
        } as Partial<Horizon.ServerApi.TransactionRecord>),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0]).not.toHaveProperty("feesPayer");
  });

  it("maps create_account with zero starting balance to no operations", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "create_account",
        transaction_hash: "txcreatezero",
        funder: "GFUNDERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        account: "GNEWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        starting_balance: "0.0000000",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions).toHaveLength(0);
  });

  it("maps payment using to_muxed when to is absent", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txmuxed",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: undefined,
        to_muxed: "GTO_MUXEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.5000000",
        asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    const transfers = block.transactions[0].operations.filter(o => o.type === "transfer");
    expect(transfers.some(o => "peer" in o && o.peer === "GTO_MUXEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(true);
  });

  it("maps change_trust with zero limit as OPT_OUT", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "change_trust",
        transaction_hash: "txoptout",
        trustor: "GTRUSTORAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        asset_code: "ABC",
        asset_issuer: "GISSUERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        limit: "0.0000000",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations[0]).toMatchObject({
      type: "other",
      ledgerOpType: "OPT_OUT",
    });
  });

  it("path_payment_strict_send with zero amounts omits the transaction row", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_send",
        transaction_hash: "txpathzero",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.0000000",
        asset_type: "native",
        source_amount: "0.0000000",
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions).toHaveLength(0);
  });

  it("path_payment_strict_receive uses send_max when source_amount is absent", async () => {
    const sendMaxStr = "0.0200000";
    const expected = BigInt(parseAPIValue(sendMaxStr).integerValue(BigNumber.ROUND_FLOOR).toFixed(0));
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_receive",
        transaction_hash: "txrecvmax",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.0010000",
        asset_type: "native",
        send_max: sendMaxStr,
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    const sender = block.transactions[0].operations.find(o => o.type === "transfer" && o.address === "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(sender?.amount).toBe(-expected);
  });

  it("path_payment_strict_receive with no source_amount nor send_max only maps destination leg", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_receive",
        transaction_hash: "txrecvnodebit",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.5000000",
        asset_type: "native",
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations).toHaveLength(1);
    expect(block.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      address: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      asset: { type: "native" },
      amount: 5000000n,
    });
  });

  it("path_payment_strict_send with zero source_amount maps only destination leg", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_send",
        transaction_hash: "txpathsenddestonly",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.2500000",
        asset_type: "native",
        source_amount: "0.0000000",
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations).toHaveLength(1);
    expect(block.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      address: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      amount: 2500000n,
    });
  });

  it("path_payment_strict_send with zero amount maps only source leg", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "path_payment_strict_send",
        transaction_hash: "txpathsendsourceonly",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.0000000",
        asset_type: "native",
        source_amount: "1.0000000",
        source_asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations).toHaveLength(1);
    expect(block.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      address: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      amount: -10000000n,
    });
  });

  it("maps payment with only to address as single incoming transfer", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txtoonly",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "3.0000000",
        asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations).toEqual([
      expect.objectContaining({
        type: "transfer",
        address: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: 30000000n,
      }),
    ]);
  });

  it("maps payment with only from address as single outgoing transfer", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txfromonly",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "0.2500000",
        asset_type: "native",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    expect(block.transactions[0].operations).toEqual([
      expect.objectContaining({
        type: "transfer",
        address: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: -2500000n,
      }),
    ]);
  });

  it("treats payment with missing asset_type as native when mapping asset", async () => {
    fetchAllLedgerOperationsMock.mockResolvedValue([
      rawOp({
        type: "payment",
        transaction_hash: "txnoassettype",
        from: "GFROMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        to: "GTOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        amount: "1.0000000",
        asset_type: undefined,
        asset_code: "USD",
        asset_issuer: "GISSUERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        transactionRecord: txRecord(),
      }),
    ]);

    const block = await getBlock(10);
    const transfers = block.transactions[0].operations.filter(o => o.type === "transfer");
    expect(transfers.every(t => t.type === "transfer" && t.asset.type === "native")).toBe(true);
  });
});
