import { HttpResponse, http } from "msw";
import coinConfig, { StellarCoinConfig } from "../config";
import { setupServer } from "msw/node";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { StellarAccount } from "../types";
import { SyncConfig } from "@ledgerhq/types-live";
import { getAccountShape } from "./synchronization";

const HORIZON_TEST_BASE_URL = "https://horizon.example.com";

const generateFakeTxHash = () => {
  let hash = "";
  const hexChars = "0123456789abcdef";

  for (let i = 0; i < 64; i++) {
    hash += hexChars[Math.floor(Math.random() * 16)];
  }

  return hash;
};

const generateOperationsList = (address: string, count = 100) => {
  const operations = [];
  for (let i = 0; i < count; i++) {
    const randomId = Math.floor(Math.random() * 1000000000);
    const randomTxHash = generateFakeTxHash();
    const operation = {
      _links: {
        transaction: {
          href: `${HORIZON_TEST_BASE_URL}/transactions/${randomTxHash}`,
        },
      },
      id: randomId.toString(),
      paging_token: randomId.toString(),
      transaction_successful: true,
      source_account: address,
      type: "payment",
      type_i: 1,
      created_at: "2025-03-12T07:13:30Z",
      transaction_hash: randomTxHash,
      asset_type: "native",
      from: address,
      to: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      amount: "1.0000000",
    };
    operations.push(operation);
  }

  return operations;
};

const handles = [
  http.get(`${HORIZON_TEST_BASE_URL}/accounts/:addr`, ({ params }) => {
    const addr = params.addr as string;

    return HttpResponse.json({
      id: addr,
      account_id: addr,
      sequence: "126500681086402560",
      subentry_count: 0,
      last_modified_ledger: 56086052,
      last_modified_time: "2025-03-10T10:24:01Z",
      thresholds: {
        low_threshold: 0,
        med_threshold: 0,
        high_threshold: 0,
      },
      flags: {
        auth_required: false,
        auth_revocable: false,
        auth_immutable: false,
        auth_clawback_enabled: false,
      },
      balances: [
        {
          balance: "83277.0750826",
          buying_liabilities: "0.0000000",
          selling_liabilities: "0.0000000",
          asset_type: "native",
        },
      ],
      signers: [
        {
          weight: 1,
          key: addr,
          type: "ed25519_public_key",
        },
      ],
      data: {},
      num_sponsoring: 0,
      num_sponsored: 0,
      paging_token: addr,
    });
  }),

  http.get(`${HORIZON_TEST_BASE_URL}/fee_stats`, () => {
    return HttpResponse.json({
      last_ledger: "56116307",
      last_ledger_base_fee: "100",
      ledger_capacity_usage: "0.56",
      fee_charged: {
        max: "404782",
        min: "100",
        mode: "100",
        p10: "100",
        p20: "100",
        p30: "100",
        p40: "100",
        p50: "100",
        p60: "100",
        p70: "100",
        p80: "100",
        p90: "100",
        p95: "100",
        p99: "100",
      },
      max_fee: {
        max: "129853690",
        min: "100",
        mode: "5000002",
        p10: "101",
        p20: "2569",
        p30: "15885",
        p40: "51234",
        p50: "100159",
        p60: "250005",
        p70: "500000",
        p80: "2000001",
        p90: "5000002",
        p95: "7062290",
        p99: "112536447",
      },
    });
  }),

  http.get(`${HORIZON_TEST_BASE_URL}/transactions/:txId`, ({ params }) => {
    const txId = params.txId as string;
    const ledgerNum = Math.floor(Math.random() * 1000000);

    return HttpResponse.json({
      _links: {
        ledger: {
          href: `${HORIZON_TEST_BASE_URL}/ledgers/${ledgerNum}`,
        },
      },
      id: txId,
      hash: txId,
      ledger: ledgerNum,
      created_at: "2024-11-07T01:24:02Z",
    });
  }),

  http.get(`${HORIZON_TEST_BASE_URL}/ledgers/:ledgerNum`, () => {
    return HttpResponse.json({
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      closed_at: "2024-01-07T09:28:18Z",
    });
  }),
];

const mockServer = setupServer();

describe("getAccountShape", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): StellarCoinConfig => ({
        status: { type: "active" },
        explorer: {
          url: HORIZON_TEST_BASE_URL,
          fetchLimit: 100,
        },
      }),
    );
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    let requestCount = 0; // track the number of requests

    mockServer.resetHandlers();
    mockServer.use(
      ...handles,
      http.get(`${HORIZON_TEST_BASE_URL}/accounts/:addr/operations`, ({ params, request }) => {
        const addr = params.addr as string;

        const url = new URL(request.url);
        const order = url.searchParams.get("order");

        let operationsCount = 100;

        // init sync, reach the threshold for fetching operations
        if (addr == "GC65W5WLL7FN6WASRY5RCQAFF2CM75RBY2A6G7GF6UP244PVPUFBLIB6") {
          if (order !== "desc") {
            return HttpResponse.json({}, { status: 400 });
          }
        }

        // init sync, not reach the threshold for fetching operations
        if (addr == "GBRBXWKLSAE2JMVCJSPC2NJEOS33MLMQ6DPSBEK76DEB5A6Q3DR43BJC") {
          if (order !== "desc") {
            return HttpResponse.json({}, { status: 400 });
          }
          if (requestCount >= 3) {
            operationsCount = 0;
          }
        }

        // sync, fetch new operations after init sync
        if (addr == "GBYLYVN3JLX4CTJ7HRAME5MNT5BJ32JLYBI7M7R5TI35I3HR6DLU46CC") {
          switch (requestCount) {
            case 0:
              operationsCount = 80;
              break;
            case 2:
              {
                operationsCount = 10;
                if (order !== "asc") {
                  return HttpResponse.json({}, { status: 400 });
                }
              }
              break;
            default:
              operationsCount = 0;
          }
        }

        requestCount++;

        const resp = {
          _links: {
            self: {
              href: `${HORIZON_TEST_BASE_URL}/accounts/${addr}/operations?order=${order}`,
            },
            next: {
              href: `${HORIZON_TEST_BASE_URL}/accounts/${addr}/operations?order=${order}`,
            },
            prev: {
              href: `${HORIZON_TEST_BASE_URL}/accounts/${addr}/operations?order=${order}`,
            },
          },
          _embedded: {
            records: generateOperationsList(addr, operationsCount),
          },
        };

        return HttpResponse.json(resp);
      }),
    );
  });

  afterAll(() => {
    mockServer.close();
  });

  it("init sync, reach the threshold for fetching operations", async () => {
    const info = {
      address: "GC65W5WLL7FN6WASRY5RCQAFF2CM75RBY2A6G7GF6UP244PVPUFBLIB6",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
    } as AccountShapeInfo<StellarAccount>;
    const syncConfig = {} as SyncConfig;
    const account = await getAccountShape(info, syncConfig);
    expect(account.operations?.length).toEqual(1000);
  });

  it("init sync, not reach the threshold for fetching operations", async () => {
    const info = {
      address: "GBRBXWKLSAE2JMVCJSPC2NJEOS33MLMQ6DPSBEK76DEB5A6Q3DR43BJC",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
    } as AccountShapeInfo<StellarAccount>;
    const syncConfig = {} as SyncConfig;
    const account = await getAccountShape(info, syncConfig);
    expect(account.operations?.length).toEqual(300);
  });

  it("sync, fetch new operations after init sync", async () => {
    const initInfo = {
      address: "GBYLYVN3JLX4CTJ7HRAME5MNT5BJ32JLYBI7M7R5TI35I3HR6DLU46CC",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
    } as AccountShapeInfo<StellarAccount>;
    const syncConfig = {} as SyncConfig;
    const initAccount = await getAccountShape(initInfo, syncConfig);
    expect(initAccount.operations?.length).toEqual(80);

    const info = {
      address: "GBYLYVN3JLX4CTJ7HRAME5MNT5BJ32JLYBI7M7R5TI35I3HR6DLU46CC",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
      initialAccount: initAccount,
    } as AccountShapeInfo<StellarAccount>;
    const account = await getAccountShape(info, syncConfig);
    expect(account.operations?.length).toEqual(90);
  });
});
