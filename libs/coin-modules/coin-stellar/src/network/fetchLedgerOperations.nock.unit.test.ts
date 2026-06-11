import nock from "nock";
import coinConfig, { type StellarCoinConfig } from "../config";
import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import { fetchAllLedgerOperations, fetchLedgerRecord } from "./horizon";

const HORIZON = "https://horizon-testnet.stellar.org";

let originalGetCoinConfig: CoinConfig<StellarCoinConfig>;

/** Minimal Horizon payment op shape for nock fixtures (embedded.records). */
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

function setExplorer(fetchLimit = 100) {
  coinConfig.setCoinConfig(
    (): StellarCoinConfig =>
      ({
        status: { type: "active" },
        explorer: { url: `${HORIZON}/`, fetchLimit },
      }) as StellarCoinConfig,
  );
}

describe("fetchLedgerRecord / fetchAllLedgerOperations (nock)", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
    setExplorer(100);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("fetchLedgerRecord maps 404 to not found error", async () => {
    nock(HORIZON).get("/ledgers/424242").reply(404, {
      status: 404,
      type: "https://stellar.org/horizon-errors/not_found",
    });

    await expect(fetchLedgerRecord(424242)).rejects.toThrow("Stellar ledger 424242 not found");
  });

  it("fetchAllLedgerOperations maps 404 to not found error", async () => {
    nock(HORIZON)
      .get(uri => uri.startsWith("/ledgers/424243/operations"))
      .reply(404, { status: 404, type: "https://stellar.org/horizon-errors/not_found" });

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
    nock(HORIZON).get("/ledgers/3").reply(200, ledgerBody);

    const rec = await fetchLedgerRecord(3);
    expect(rec.sequence).toBe(3);
    expect(rec.hash).toBe(ledgerBody.hash);
  });

  it("fetchAllLedgerOperations returns embedded records on 200", async () => {
    const page = {
      _links: {
        self: { href: `${HORIZON}/ledgers/10/operations` },
        next: { href: "" },
        prev: { href: "" },
      },
      _embedded: { records: [MINIMAL_HORIZON_PAYMENT_OP] },
    };

    nock(HORIZON)
      .get(uri => uri.includes("/ledgers/10/operations"))
      .reply(200, page);

    const records = await fetchAllLedgerOperations(10);
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe("payment");
  });

  it("fetchAllLedgerOperations paginates when page is full then stops on empty page", async () => {
    setExplorer(1);

    const nextHref = `${HORIZON}/ledgers/11/operations?cursor=after&limit=1&order=asc&include_failed=true&join=transactions`;

    const page1 = {
      _links: {
        self: { href: `${HORIZON}/ledgers/11/operations` },
        next: { href: nextHref },
        prev: { href: "" },
      },
      _embedded: { records: [MINIMAL_HORIZON_PAYMENT_OP] },
    };

    const page2 = {
      _links: { self: { href: "" }, next: { href: "" }, prev: { href: "" } },
      _embedded: { records: [] },
    };

    nock(HORIZON).get("/ledgers/11/operations").query(true).reply(200, page1);
    nock(HORIZON).get("/ledgers/11/operations").query(true).reply(200, page2);

    const records = await fetchAllLedgerOperations(11);
    expect(records.length).toBe(1);
  });
});
