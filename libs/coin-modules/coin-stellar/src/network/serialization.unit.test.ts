import type { Horizon } from "@stellar/stellar-sdk";
import type { BalanceAsset, RawOperation } from "../types";
import {
  BASE_RESERVE,
  MIN_BALANCE,
  getReservedBalance,
  rawOperationsToOperations,
} from "./serialization";

const ADDR = "GBADDR";
const OTHER_ADDR = "GBOTHER";
const THIRD_ADDR = "GBTHIRD";
const ACCOUNT_ID = "stellar:GBADDR";
const TX_HASH = "txh";
const BLOCK_HASH = "block-hash";
const BLOCK_TIME = "2025-06-01T12:00:00Z";
const CREATED_AT = "2025-06-01T12:00:00Z";

type TxOverrides = Partial<{
  ledger_attr: number;
  fee_charged: string;
  fee_account: string;
  source_account_sequence: string;
  memo_type: string;
  memo: string | undefined;
  ledger_hash: string;
  ledger_closed_at: string;
}>;

function makeTx(overrides: TxOverrides = {}) {
  const {
    ledger_attr = 100,
    fee_charged = "100",
    fee_account,
    source_account_sequence = "42",
    memo_type = "none",
    memo,
    ledger_hash = BLOCK_HASH,
    ledger_closed_at = BLOCK_TIME,
  } = overrides;

  return {
    ledger_attr,
    fee_charged,
    fee_account,
    source_account_sequence,
    memo_type,
    memo,
    ledger: jest.fn().mockResolvedValue({
      hash: ledger_hash,
      closed_at: ledger_closed_at,
    }),
  };
}

// `RawOperation.type` is constrained to a narrow union of Horizon operation type
// literals which makes building fixtures with plain strings impractical, so we
// accept any string and cast at the construction site.
type RawOpInput = { type: string } & Record<string, unknown>;

function makeOp(rawOpOverrides: RawOpInput, txOverrides: TxOverrides = {}): RawOperation {
  return {
    id: "op-1",
    paging_token: "pt-1",
    source_account: ADDR,
    transaction_hash: TX_HASH,
    transaction_successful: true,
    created_at: CREATED_AT,
    transaction: jest.fn().mockResolvedValue(makeTx(txOverrides)),
    ...rawOpOverrides,
  } as unknown as RawOperation;
}

describe("constants", () => {
  it("exports BASE_RESERVE equal to 0.5 (stellar protocol base reserve in XLM)", () => {
    expect(BASE_RESERVE).toBe(0.5);
  });

  it("exports MIN_BALANCE equal to 1 (minimum stellar account balance in XLM)", () => {
    expect(MIN_BALANCE).toBe(1);
  });
});

describe("getReservedBalance", () => {
  type AccountInput = Partial<{
    num_sponsoring: string;
    num_sponsored: string;
    subentry_count: number;
    balances: Array<Partial<BalanceAsset>>;
  }>;

  function makeAccount(overrides: AccountInput = {}): Horizon.ServerApi.AccountRecord {
    return {
      num_sponsoring: "0",
      num_sponsored: "0",
      subentry_count: 0,
      balances: [{ asset_type: "native", selling_liabilities: "0" }],
      ...overrides,
    } as unknown as Horizon.ServerApi.AccountRecord;
  }

  it("should return 1 XLM (the minimum reserve) when account has no subentries, sponsors or liabilities", () => {
    expect(getReservedBalance(makeAccount()).toNumber()).toBe(1);
  });

  it("should add 0.5 XLM per subentry", () => {
    expect(getReservedBalance(makeAccount({ subentry_count: 4 })).toNumber()).toBe(3);
  });

  it("should add 0.5 XLM per sponsoring entry", () => {
    expect(getReservedBalance(makeAccount({ num_sponsoring: "2" })).toNumber()).toBe(2);
  });

  it("should subtract 0.5 XLM per sponsored entry", () => {
    expect(
      getReservedBalance(makeAccount({ num_sponsoring: "4", num_sponsored: "2" })).toNumber(),
    ).toBe(2);
  });

  it("should add native selling_liabilities on top of the entry reserve", () => {
    expect(
      getReservedBalance(
        makeAccount({ balances: [{ asset_type: "native", selling_liabilities: "10.5" }] }),
      ).toNumber(),
    ).toBe(11.5);
  });

  it("should ignore non-native selling_liabilities (only the native balance contributes)", () => {
    expect(
      getReservedBalance(
        makeAccount({
          balances: [
            { asset_type: "credit_alphanum4", selling_liabilities: "100", asset_code: "USDC" },
            { asset_type: "native", selling_liabilities: "2" },
          ],
        }),
      ).toNumber(),
    ).toBe(3);
  });

  it("should fall back to 0 selling_liabilities when no native balance entry exists", () => {
    expect(getReservedBalance(makeAccount({ balances: [] })).toNumber()).toBe(1);
  });

  it("should treat undefined selling_liabilities on the native balance as 0", () => {
    expect(
      getReservedBalance(makeAccount({ balances: [{ asset_type: "native" }] })).toNumber(),
    ).toBe(1);
  });

  it("should combine subentries, sponsoring/sponsored entries and selling_liabilities", () => {
    // (2 + 3 + 2 - 1) * 0.5 + 4.5 = 6 * 0.5 + 4.5 = 7.5
    expect(
      getReservedBalance(
        makeAccount({
          subentry_count: 3,
          num_sponsoring: "2",
          num_sponsored: "1",
          balances: [{ asset_type: "native", selling_liabilities: "4.5" }],
        }),
      ).toNumber(),
    ).toBe(7.5);
  });
});

describe("rawOperationsToOperations", () => {
  describe("address filtering", () => {
    it("should exclude operations not involving the address", async () => {
      const op = makeOp({
        type: "payment",
        from: OTHER_ADDR,
        to: THIRD_ADDR,
        amount: "10",
        source_account: OTHER_ADDR,
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(0);
    });

    it("should include operations where `from` equals the address", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "10",
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });

    it("should include operations where `to` equals the address", async () => {
      const op = makeOp({
        type: "payment",
        from: OTHER_ADDR,
        to: ADDR,
        amount: "10",
        source_account: OTHER_ADDR,
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });

    it("should include operations where `funder` equals the address", async () => {
      const op = makeOp({
        type: "create_account",
        funder: ADDR,
        account: OTHER_ADDR,
        starting_balance: "10",
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });

    it("should include operations where `account` equals the address", async () => {
      const op = makeOp({
        type: "create_account",
        funder: OTHER_ADDR,
        account: ADDR,
        starting_balance: "10",
        source_account: OTHER_ADDR,
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });

    it("should include operations where `trustor` equals the address", async () => {
      const op = makeOp({
        type: "change_trust",
        trustor: ADDR,
        limit: "1000",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
        source_account: OTHER_ADDR,
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });

    it("should include operations where `source_account` equals the address", async () => {
      const op = makeOp({
        type: "change_trust",
        trustor: OTHER_ADDR,
        limit: "1000",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
        source_account: ADDR,
      });
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });
  });

  describe("operation type filtering", () => {
    it.each(["manage_offer", "set_options", "allow_trust", "manage_data", "bump_sequence"])(
      "should filter out unsupported %s operation",
      async type => {
        const op = makeOp({
          type,
          source_account: ADDR,
        });
        const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
        expect(result).toHaveLength(0);
      },
    );

    it.each([
      ["create_account", { funder: ADDR, account: OTHER_ADDR, starting_balance: "1" }],
      ["payment", { from: ADDR, to: OTHER_ADDR, amount: "1" }],
      ["path_payment_strict_send", { from: ADDR, to: OTHER_ADDR, amount: "1" }],
      ["path_payment_strict_receive", { from: ADDR, to: OTHER_ADDR, amount: "1" }],
      [
        "change_trust",
        { trustor: ADDR, limit: "1000", asset_code: "USDC", asset_issuer: "GISSUER" },
      ],
    ])("should include supported %s operation", async (type, extra) => {
      const op = makeOp({ type, ...extra } as RawOpInput);
      const result = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(result).toHaveLength(1);
    });
  });

  describe("minHeight filtering", () => {
    it("should exclude operations from blocks strictly below minHeight", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "5" },
        { ledger_attr: 99 },
      );
      expect(await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 100)).toHaveLength(0);
    });

    it("should include operations at minHeight", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "5" },
        { ledger_attr: 100 },
      );
      expect(await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 100)).toHaveLength(1);
    });
  });

  describe("operation type determination", () => {
    it("should mark create_account as OUT when funder is the address", async () => {
      const op = makeOp({
        type: "create_account",
        funder: ADDR,
        account: OTHER_ADDR,
        starting_balance: "10",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("OUT");
    });

    it("should mark create_account as IN when account is the address", async () => {
      const op = makeOp({
        type: "create_account",
        funder: OTHER_ADDR,
        account: ADDR,
        starting_balance: "10",
        source_account: OTHER_ADDR,
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("IN");
    });

    it("should mark payment as OUT when from is the address and recipient differs", async () => {
      const op = makeOp({ type: "payment", from: ADDR, to: OTHER_ADDR, amount: "5" });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("OUT");
    });

    it("should mark payment as IN when the address is the recipient", async () => {
      const op = makeOp({
        type: "payment",
        from: OTHER_ADDR,
        to: ADDR,
        amount: "5",
        source_account: OTHER_ADDR,
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("IN");
    });

    it("should mark self-payments (from=to=address) as IN", async () => {
      const op = makeOp({ type: "payment", from: ADDR, to: ADDR, amount: "5" });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("IN");
    });

    it("should mark path_payment_strict_send as OUT when address is not the recipient", async () => {
      const op = makeOp({
        type: "path_payment_strict_send",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "5",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("OUT");
    });

    it("should mark path_payment_strict_send as IN when address is the recipient", async () => {
      const op = makeOp({
        type: "path_payment_strict_send",
        from: OTHER_ADDR,
        to: ADDR,
        amount: "5",
        source_account: OTHER_ADDR,
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("IN");
    });

    it("should always mark path_payment_strict_receive as IN", async () => {
      const op = makeOp({
        type: "path_payment_strict_receive",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "5",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("IN");
    });

    it("should mark change_trust as OPT_IN when limit is non-zero", async () => {
      const op = makeOp({
        type: "change_trust",
        trustor: ADDR,
        limit: "1000",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("OPT_IN");
    });

    it("should mark change_trust as OPT_OUT when limit is zero", async () => {
      const op = makeOp({
        type: "change_trust",
        trustor: ADDR,
        limit: "0",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("OPT_OUT");
    });
  });

  describe("memo handling", () => {
    it("should set NO_MEMO when memo_type is 'none'", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { memo_type: "none" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({ memo: { type: "NO_MEMO" } });
    });

    it("should set MEMO_ID with raw memo when memo_type is 'id'", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { memo_type: "id", memo: "12345" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({ memo: { type: "MEMO_ID", value: "12345" } });
    });

    it("should set MEMO_TEXT with raw memo when memo_type is 'text'", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { memo_type: "text", memo: "hello" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({ memo: { type: "MEMO_TEXT", value: "hello" } });
    });

    it("should convert MEMO_RETURN from base64 to hex", async () => {
      const memoBase64 = Buffer.from("deadbeef", "hex").toString("base64");
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { memo_type: "return", memo: memoBase64 },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({
        memo: { type: "MEMO_RETURN", value: "deadbeef" },
      });
    });

    it("should convert MEMO_HASH from base64 to hex", async () => {
      const memoBase64 = Buffer.from("cafebabe", "hex").toString("base64");
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { memo_type: "hash", memo: memoBase64 },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({
        memo: { type: "MEMO_HASH", value: "cafebabe" },
      });
    });

    it("should leave memo undefined when memo_type is set but memo value is missing", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { memo_type: "id", memo: undefined },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect((out.details as { memo?: unknown }).memo).toBeUndefined();
    });
  });

  describe("asset and value handling", () => {
    it("should set native asset and value=amount*10^7 for native payments", async () => {
      const op = makeOp({ type: "payment", from: ADDR, to: OTHER_ADDR, amount: "10" });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.asset).toEqual({ type: "native" });
      expect(out.value).toBe(100000000n);
      expect(out.details).toMatchObject({
        assetCode: undefined,
        assetIssuer: undefined,
        assetAmount: undefined,
      });
    });

    it("should set token asset, NONE type and value=fee_charged when asset_code+asset_issuer are present", async () => {
      const op = makeOp(
        {
          type: "payment",
          from: ADDR,
          to: OTHER_ADDR,
          amount: "10",
          asset_code: "USDC",
          asset_issuer: "GISSUER",
        },
        { fee_charged: "200" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.asset).toEqual({
        type: "token",
        assetReference: "USDC",
        assetOwner: "GISSUER",
      });
      expect(out.value).toBe(200n);
      expect(out.type).toBe("NONE");
      expect(out.details).toMatchObject({
        assetCode: "USDC",
        assetIssuer: "GISSUER",
        assetAmount: "100000000",
      });
    });

    it("should fall back to native asset when asset_code is set but asset_issuer is missing", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "10",
        asset_code: "USDC",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.asset).toEqual({ type: "native" });
    });

    it("should preserve OPT_IN/OPT_OUT type for token change_trust operations", async () => {
      const op = makeOp({
        type: "change_trust",
        trustor: ADDR,
        limit: "1000",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.type).toBe("OPT_IN");
    });

    it("should parse create_account starting_balance through the stellar unit (10^7)", async () => {
      const op = makeOp({
        type: "create_account",
        funder: ADDR,
        account: OTHER_ADDR,
        starting_balance: "2.5",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.value).toBe(25000000n);
    });
  });

  describe("failed transactions", () => {
    it("should set value=0 for IN ops when transaction failed", async () => {
      const op = makeOp(
        {
          type: "payment",
          from: OTHER_ADDR,
          to: ADDR,
          amount: "10",
          source_account: OTHER_ADDR,
          transaction_successful: false,
        },
        { fee_charged: "150" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.value).toBe(0n);
      expect(out.tx.failed).toBe(true);
    });

    it("should set value=fee_charged for OUT ops when transaction failed", async () => {
      const op = makeOp(
        {
          type: "payment",
          from: ADDR,
          to: OTHER_ADDR,
          amount: "10",
          transaction_successful: false,
        },
        { fee_charged: "150" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.value).toBe(150n);
      expect(out.tx.failed).toBe(true);
    });
  });

  describe("recipients", () => {
    it("should use to_muxed for payment when present", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        to_muxed: "MMUXED",
        amount: "10",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.recipients).toEqual(["MMUXED"]);
    });

    it("should fall back to `to` for payment when no to_muxed is set", async () => {
      const op = makeOp({ type: "payment", from: ADDR, to: OTHER_ADDR, amount: "10" });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.recipients).toEqual([OTHER_ADDR]);
    });

    it("should use `account` for create_account recipients", async () => {
      const op = makeOp({
        type: "create_account",
        funder: ADDR,
        account: OTHER_ADDR,
        starting_balance: "10",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.recipients).toEqual([OTHER_ADDR]);
    });

    it("should use `to` for path_payment_strict_send recipients", async () => {
      const op = makeOp({
        type: "path_payment_strict_send",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "10",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.recipients).toEqual([OTHER_ADDR]);
    });

    it("should return empty recipients for change_trust", async () => {
      const op = makeOp({
        type: "change_trust",
        trustor: ADDR,
        limit: "1000",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.recipients).toEqual([]);
    });

    it("should return empty recipients for path_payment_strict_receive", async () => {
      const op = makeOp({
        type: "path_payment_strict_receive",
        from: OTHER_ADDR,
        to: ADDR,
        amount: "10",
        source_account: OTHER_ADDR,
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.recipients).toEqual([]);
    });
  });

  describe("sequence handling", () => {
    it("should expose source_account_sequence as a string when it is a number", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { source_account_sequence: "123456789" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({ sequence: "123456789" });
    });

    it("should expose sequence as undefined when source_account_sequence is not numeric", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { source_account_sequence: "not-a-number" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect((out.details as { sequence?: string }).sequence).toBeUndefined();
    });
  });

  describe("transaction metadata", () => {
    it("should expose fee_account as feesPayer when present (fee bump transactions)", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        { fee_account: "GSPONSOR", fee_charged: "500" },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.tx.feesPayer).toBe("GSPONSOR");
      expect(out.tx.fees).toBe(500n);
    });

    it("should omit feesPayer when fee_account is not set", async () => {
      const op = makeOp({ type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect("feesPayer" in out.tx).toBe(false);
    });

    it("should build the operation id as `${accountId}-${transactionHash}-${type}`", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "1",
        transaction_hash: "my-tx-hash",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.id).toBe(`${ACCOUNT_ID}-my-tx-hash-OUT`);
    });

    it("should populate block metadata from the ledger record", async () => {
      const op = makeOp(
        { type: "payment", from: ADDR, to: OTHER_ADDR, amount: "1" },
        {
          ledger_attr: 4242,
          ledger_hash: "ledger-hash",
          ledger_closed_at: "2025-07-04T08:30:00Z",
        },
      );
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.tx.block).toEqual({
        hash: "ledger-hash",
        height: 4242,
        time: new Date("2025-07-04T08:30:00Z"),
      });
    });

    it("should set tx.date from the operation's created_at", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "1",
        created_at: "2024-02-29T01:02:03Z",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.tx.date).toEqual(new Date("2024-02-29T01:02:03Z"));
    });

    it("should include senders from the operation source_account", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "1",
        source_account: "GSOURCE",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.senders).toEqual(["GSOURCE"]);
    });

    it("should expose pagingToken and index in details", async () => {
      const op = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "1",
        id: "op-42",
        paging_token: "pt-42",
      });
      const [out] = await rawOperationsToOperations([op], ADDR, ACCOUNT_ID, 0);
      expect(out.details).toMatchObject({ pagingToken: "pt-42", index: "op-42" });
    });
  });

  describe("batch processing", () => {
    it("should preserve relative order of the operations that pass filters", async () => {
      const opA = makeOp({
        type: "payment",
        from: ADDR,
        to: OTHER_ADDR,
        amount: "1",
        transaction_hash: "tx-a",
      });
      const opIgnored = makeOp({
        type: "manage_offer",
        source_account: ADDR,
        transaction_hash: "tx-ignored",
      });
      const opB = makeOp({
        type: "payment",
        from: OTHER_ADDR,
        to: ADDR,
        amount: "2",
        source_account: OTHER_ADDR,
        transaction_hash: "tx-b",
      });

      const result = await rawOperationsToOperations([opA, opIgnored, opB], ADDR, ACCOUNT_ID, 0);
      expect(result.map(o => o.tx.hash)).toEqual(["tx-a", "tx-b"]);
    });

    it("should return an empty array when given no operations", async () => {
      expect(await rawOperationsToOperations([], ADDR, ACCOUNT_ID, 0)).toEqual([]);
    });
  });
});
