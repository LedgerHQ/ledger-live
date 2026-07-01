import { Horizon, NotFoundError } from "@stellar/stellar-sdk";
import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import coinConfig, { type StellarCoinConfig } from "../config";
import { fetchAllLedgerOperations, fetchLedgerRecord } from "./horizon";

const HORIZON = "https://horizon-testnet.stellar.org";

let originalGetCoinConfig: CoinConfig<StellarCoinConfig>;

/** Minimal Horizon payment op shape (embedded.records). */
const MINIMAL_HORIZON_PAYMENT_OP = {
  _links: {
    self: { href: "" },
    transaction: { href: "" },
    effects: { href: "" },
    succeeds: { href: "" },
    precedes: { href: "" },
  },
  id: "1",
  paging_token: "1",
  transaction_successful: true,
  source_account: "GB7FW6GRFEH63Q3BVRT65VMB26OKHQRG74QRFUMTL6D553UKDZCDM7U",
  type: "payment",
  type_i: 1,
  created_at: "2015-07-20T20:27:50Z",
  transaction_hash: "txh",
  asset_type: "native",
  from: "GB7FW6GRFEH63Q3BVRT65VMB26OKHQRG74QRFUMTL6D553UKDZCDM7U",
  to: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  amount: "1.0000000",
};

/**
 * Minimal chainable stub of a Horizon call builder: every builder method returns
 * the builder itself, and `call()` resolves (or rejects) with the configured value.
 * Lets us drive `getServer().ledgers()...call()` / `.operations()...call()` without HTTP.
 */
function callBuilder(call: () => Promise<unknown>): unknown {
  const builder: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "call") return call;
        return () => builder;
      },
    },
  );
  return builder;
}

function setExplorer(fetchLimit = 100): void {
  coinConfig.setCoinConfig(
    (): StellarCoinConfig =>
      ({
        status: { type: "active" },
        explorer: { url: `${HORIZON}/`, fetchLimit },
      }) as StellarCoinConfig,
  );
}

function mockLedgers(call: () => Promise<unknown>): void {
  jest.spyOn(Horizon.Server.prototype, "ledgers").mockReturnValue(callBuilder(call) as never);
}

function mockOperations(call: () => Promise<unknown>): void {
  jest.spyOn(Horizon.Server.prototype, "operations").mockReturnValue(callBuilder(call) as never);
}

describe("fetchLedgerRecord / fetchAllLedgerOperations", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  beforeEach(() => {
    setExplorer(100);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetchLedgerRecord maps 404 to not found error", async () => {
    mockLedgers(() => Promise.reject(new NotFoundError("Not Found", {} as never)));

    await expect(fetchLedgerRecord(424242)).rejects.toThrow("Stellar ledger 424242 not found");
  });

  it("fetchAllLedgerOperations maps 404 to not found error", async () => {
    mockOperations(() => Promise.reject(new NotFoundError("Not Found", {} as never)));

    await expect(fetchAllLedgerOperations(424243)).rejects.toThrow(
      "Stellar ledger 424243 not found",
    );
  });

  it("fetchLedgerRecord returns ledger on 200", async () => {
    const ledgerBody = {
      _links: { self: { href: "" }, transactions: { href: "" }, operations: { href: "" } },
      id: "abc",
      paging_token: "abc",
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      prev_hash: "",
      sequence: 3,
      successful_transaction_count: 0,
      failed_transaction_count: 0,
      operation_count: 0,
      tx_set_operation_count: 0,
      closed_at: "2015-07-20T20:27:50Z",
      total_coins: "100000000000.0000000",
      fee_pool: "0.0000000",
      base_fee_in_stroops: 100,
      base_reserve_in_stroops: 100000000,
      max_tx_set_size: 50,
      protocol_version: 1,
      header_xdr: "",
    };
    mockLedgers(() => Promise.resolve(ledgerBody));

    const rec = await fetchLedgerRecord(3);
    expect(rec.sequence).toBe(3);
    expect(rec.hash).toBe(ledgerBody.hash);
  });

  it("fetchAllLedgerOperations returns embedded records on 200", async () => {
    const page = {
      records: [MINIMAL_HORIZON_PAYMENT_OP],
      next: () => Promise.resolve({ records: [] }),
    };
    mockOperations(() => Promise.resolve(page));

    const records = await fetchAllLedgerOperations(10);
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe("payment");
  });

  it("fetchAllLedgerOperations paginates when page is full then stops on empty page", async () => {
    setExplorer(1);

    const page2 = { records: [], next: () => Promise.resolve({ records: [] }) };
    const page1 = { records: [MINIMAL_HORIZON_PAYMENT_OP], next: () => Promise.resolve(page2) };
    mockOperations(() => Promise.resolve(page1));

    const records = await fetchAllLedgerOperations(11);
    expect(records.length).toBe(1);
  });
});
