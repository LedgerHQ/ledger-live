import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

export const HORIZON_TEST_BASE_URL = "https://horizon.example.com";

export const handles = [
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
export const mockServer = setupServer();
