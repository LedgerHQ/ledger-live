import BigNumber from "bignumber.js";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import coinConfig from "../config";
import { computeBalance, computeBalanceBridge, getBalance } from "./getBalance";

const account = JSON.parse(`
  {
  "account_name": "FreezeBandwith",
  "address": "41ae18eb0a9e067f8884058470ed187f44135d816d",
  "balance": 1781772,
  "votes": [
    {
      "vote_address": "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
      "vote_count": 15
    },
    {
      "vote_address": "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U",
      "vote_count": 1
    },
    {
      "vote_address": "TCZvvbn4SCVyNhCAt1L8Kp1qk5rtMiKdBB",
      "vote_count": 2
    }
  ],
  "create_time": 1556974023000,
  "latest_opration_time": 1653052509000,
  "latest_withdraw_time": 1652964336000,
  "latest_consume_free_time": 1653052509000,
  "net_window_size": 28800000,
  "net_window_optimized": true,
  "account_resource": {
    "frozen_balance_for_energy": {
      "frozen_balance": 26000000,
      "expire_time": 1580573091000
    },
    "latest_consume_time_for_energy": 1581943389000,
    "energy_window_size": 28800000,
    "energy_window_optimized": true
  },
  "owner_permission": {
    "permission_name": "owner",
    "threshold": 1,
    "keys": [
      {
        "address": "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
        "weight": 1
      }
    ]
  },
  "active_permission": [
    {
      "type": "Active",
      "id": 2,
      "permission_name": "active",
      "threshold": 1,
      "operations": "7fff1fc0033e0000000000000000000000000000000000000000000000000000",
      "keys": [
        {
          "address": "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
          "weight": 1
        }
      ]
    }
  ],
  "frozenV2": [
    {},
    {
      "type": "ENERGY"
    },
    {
      "type": "TRON_POWER"
    }
  ],
  "assetV2": [
    {
      "key": "1002897",
      "value": 10000000
    },
    {
      "key": "1002775",
      "value": 5000000
    },
    {
      "key": "1002830",
      "value": 10000000
    },
    {
      "key": "1002962",
      "value": 10000000
    },
    {
      "key": "1002876",
      "value": 10000000
    },
    {
      "key": "1002398",
      "value": 5000000
    },
    {
      "key": "1002573",
      "value": 5000000
    },
    {
      "key": "1002881",
      "value": 10000000
    },
    {
      "key": "1002927",
      "value": 10000000
    },
    {
      "key": "1002736",
      "value": 5000000
    },
    {
      "key": "1002814",
      "value": 10000000
    },
    {
      "key": "1002858",
      "value": 10000000
    },
    {
      "key": "1002000",
      "value": 26888000
    },
    {
      "key": "1004031",
      "value": 9856699
    }
  ],
  "free_asset_net_usageV2": [
    {
      "key": "1002897",
      "value": 0
    },
    {
      "key": "1002775",
      "value": 0
    },
    {
      "key": "1002830",
      "value": 0
    },
    {
      "key": "1002962",
      "value": 0
    },
    {
      "key": "1002876",
      "value": 0
    },
    {
      "key": "1002398",
      "value": 0
    },
    {
      "key": "1002573",
      "value": 0
    },
    {
      "key": "1002881",
      "value": 0
    },
    {
      "key": "1002927",
      "value": 0
    },
    {
      "key": "1002736",
      "value": 0
    },
    {
      "key": "1002814",
      "value": 0
    },
    {
      "key": "1002858",
      "value": 0
    },
    {
      "key": "1002000",
      "value": 0
    },
    {
      "key": "1004031",
      "value": 0
    }
  ],
  "trc20": [
    {
      "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7": "46825830"
    },
    {
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t": "376"
    }
  ]
}
`);

describe("computeBalance", () => {
  it("returns expected value", () => {
    const balance = computeBalance(account);
    expect(balance).toEqual({ value: BigInt("27781772"), asset: { type: "native" } });
  });
});

describe("getBalance", () => {
  const mockServer = setupServer();
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    explorer: { url: "http://tron.explorer.com" },
  }));

  it("returns expected value", async () => {
    mockServer.listen({ onUnhandledRequest: "error" });
    mockServer.use(
      http.get(
        "http://tron.explorer.com/v1/accounts/41ae18eb0a9e067f8884058470ed187f44135d816d",
        () => HttpResponse.json({ data: [account] }),
      ),
    );
    const balance = await getBalance("41ae18eb0a9e067f8884058470ed187f44135d816d");
    expect(balance).toEqual([
      { asset: { type: "native" }, value: 27781772n },
      {
        asset: { type: "trc10", assetReference: "1002897" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002775" },
        value: 5000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002830" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002962" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002876" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002398" },
        value: 5000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002573" },
        value: 5000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002881" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002927" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002736" },
        value: 5000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002814" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002858" },
        value: 10000000n,
      },
      {
        asset: { type: "trc10", assetReference: "1002000" },
        value: 26888000n,
      },
      {
        asset: { type: "trc10", assetReference: "1004031" },
        value: 9856699n,
      },
      {
        asset: {
          type: "trc20",
          assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        },
        value: 46825830n,
      },
      {
        asset: {
          type: "trc20",
          assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        },
        value: 376n,
      },
    ]);
  });

  it("returns empty balance if account is inactive", async () => {
    mockServer.listen({ onUnhandledRequest: "error" });
    mockServer.use(
      http.get(
        "http://tron.explorer.com/v1/accounts/41ae18eb0a9e067f8884058470ed187f44135d816d",
        () => HttpResponse.json({ data: [] }),
      ),
    );
    const balance = await getBalance("41ae18eb0a9e067f8884058470ed187f44135d816d");
    expect(balance).toEqual([{ asset: { type: "native" }, value: 0n }]);
  });

  mockServer.close();
});

describe("computeBalanceBridge", () => {
  it("returns expected value", () => {
    const balance = computeBalanceBridge(account);
    expect(balance).toEqual(new BigNumber("27781772"));
  });
});
