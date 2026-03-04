import { ElectronApplication, Page } from "@playwright/test";

/**
 * Earn API mock data and helpers for e2e tests.
 *
 * The earn live app calls `POST /v1/stakes` on its backend to fetch user positions.
 * These helpers intercept that call on the webview and return mock position data,
 * enabling tests that require active DeFi or earn-native positions.
 *
 * API hosts:
 *  - Production: https://earn.api.live.ledger.com
 *  - Staging:    https://earn.api.live.ledger-test.com
 */

// --- Mock stake data (matches components["schemas"]["StakeViewV1Success"]) ---

export const mockEthNativeStake = {
  protocol_name: "Kiln",
  currency: "ethereum",
  interest: { type: "APR", value: "0.033009601636187056", currency: "ethereum" },
  staked_balance: "1000000000000000000",
  status: "activated",
  commission: "Gross",
  rewards: [
    { currency: "ethereum", total: "100", last24H: "0", last7D: "0", last30D: "0", apy: "3.3" },
  ],
  details: {
    validator_address:
      "0xb827b76360f9f2a1bacc70d684a944d51a5699842924cfb7d41d8a936964f1691a4182e8d7b88dc64a24db7ac7aace8e",
    deposit_tx_sender: "mock-deposit-sender",
    consensus_rewards: "1186958821000000000",
    execution_rewards: "923513202584148972",
    claimable_consensus_rewards: "0",
    claimable_execution_rewards: "0",
    type: "EthNativeDetailsView",
    state: "active_ongoing",
    is_kiln: true,
  },
};

export const mockStEthLidoStake = {
  protocol_name: "Lido",
  currency: "ethereum/erc20/steth",
  interest: { type: "APR", value: "0.02950714285714285", currency: "ethereum" },
  since: "2023-03-10T21:42:35Z",
  staked_balance: "1219031542847281544774",
  status: "activated",
  commission: "Gross",
  rewards: [
    {
      currency: "ethereum",
      total: "1001",
      last24H: "1",
      last7D: "10",
      last30D: "100",
      apy: "2.95",
    },
  ],
  details: {
    contractAddress: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
    type: "LidoDetailsView",
  },
};

export const mockUsdtMorphoStake = {
  protocol_name: "Morpho",
  currency: "ethereum/erc20/usd_tether__erc20_",
  interest: {
    type: "APY",
    value: "0.021473014354705812",
    currency: "ethereum/erc20/usd_tether__erc20_",
  },
  logo: "https://public.kiln.fi/icons/defi-protocols/morpho.svg",
  staked_balance: "15025199",
  status: "activated",
  commission: "Gross",
  rewards: [
    {
      currency: "ethereum/erc20/usd_tether__erc20_",
      total: "100",
      last24H: "25",
      last7D: "25",
      last30D: "25",
      apy: "2.14",
    },
  ],
  details: {
    contract_address: "0x96B22EB7178d116797e57197e586b70FedAE8Fdd",
    protocol: "morpho",
    protocol_display_name: "Morpho",
    protocol_icon: "https://public.kiln.fi/icons/defi-protocols/morpho.svg",
    asset_icon: "https://public.kiln.fi/icons/assets/usdt.svg",
    shared_symbol: "mstkeUSDT",
    type: "KilnDefiDetailsView",
  },
};

// --- Response builders ---

interface BatchedView {
  id: { network: string; address: string };
  stake: Record<string, unknown>;
  type: "BatchStakeViewV1";
}

/**
 * Build a full `POST /v1/stakes` response body from individual stakes,
 * associating each with the given network and address.
 */
export function buildStakesResponse(
  stakes: Record<string, unknown>[],
  network: string,
  address: string,
): BatchedView[] {
  return stakes.map(stake => ({
    id: { network, address },
    stake,
    type: "BatchStakeViewV1",
  }));
}

// --- Webview route interception ---

/**
 * Intercept the earn API `POST /v1/stakes` endpoint on the webview
 * and return the provided mock response.
 *
 * Must be called BEFORE navigating to the earn page so the route is
 * registered before the earn app makes its first API call.
 *
 * Usage:
 * ```ts
 * const mockResponse = buildStakesResponse(
 *   [mockEthNativeStake, mockUsdtMorphoStake],
 *   "ethereum",
 *   account.address!,
 * );
 * const cleanup = await interceptEarnStakes(electronApp, mockResponse);
 * // ... run test ...
 * // cleanup is automatic when the page closes
 * ```
 */
export async function interceptEarnStakes(
  electronApp: ElectronApplication,
  mockResponse: BatchedView[],
): Promise<Page> {
  return new Promise<Page>(resolve => {
    const handler = async (page: Page) => {
      const windows = electronApp.windows();
      // The webview is the second window
      if (windows.length <= 1) return;

      electronApp.off("window", handler);

      // Intercept POST /v1/stakes on both production and staging earn API hosts
      await page.route("**/v1/stakes", async route => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockResponse),
          });
        } else {
          await route.continue();
        }
      });

      resolve(page);
    };

    electronApp.on("window", handler);
  });
}
