import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getEnv } from "@ledgerhq/live-env";
import type { StakeObject } from "@mysten/sui/jsonRpc";
import coinConfig from "../config";
import type { SuiTransport } from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { getAccountShape } from "./synchronisation";

/** Bridge dispatch is keyed on `currency.id` (always "sui"), so we re-bind the config between runs. */
function configureTransport(transport: SuiTransport) {
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    // Every URL always present; the feature flag selects which dispatcher branch runs.
    node: {
      url: getEnv("API_SUI_NODE_PROXY"),
      graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
      grpcUrl: getEnv("API_SUI_GRPC_PROXY"),
    },
    features: { transport },
  }));
}

beforeAll(() => {
  setCryptoAssetsStore({
    findTokenByAddressInCurrency: async () => undefined,
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "0",
  });
});

const SHAPE_INFO = {
  index: 0,
  derivationPath: "44'/784'/0'/0'/0'",
  currency: getCryptoCurrencyById("sui"),
  address: FIGMENT_SUI_VALIDATOR_ADDRESS,
  initialAccount: undefined,
  derivationMode: "sui" as const,
};

const SYNC_CONFIG = { blacklistedTokenIds: [], paginationConfig: {} };

// gRPC is the reference leg. It replaced JSON-RPC here after the Sui Foundation retired the public
// mainnet fullnode (wk of 2026-07-20), which left this suite skipped with no runnable baseline.
describe("getAccountShape: gRPC vs GraphQL parity (live mainnet)", () => {
  // Two back-to-back live syncs on a high-traffic validator address: ~70s locally, but slower CI
  // runners exceeded the 90s default in `jest.integ.config.js`.
  test("balance, spendable and suiResources.stakes match across transports", async () => {
    configureTransport("grpc");
    const rpc = await getAccountShape(SHAPE_INFO, SYNC_CONFIG);

    configureTransport("graphql");
    const gql = await getAccountShape(SHAPE_INFO, SYNC_CONFIG);

    expect(gql.balance!.toFixed()).toBe(rpc.balance!.toFixed());
    expect(gql.spendableBalance!.toFixed()).toBe(rpc.spendableBalance!.toFixed());
    expect(gql.blockHeight).toBe(rpc.blockHeight);

    // Reward drift is exercised at the SDK layer; here we just check the bridge didn't reorder or drop stakes.
    const flat = (groups: NonNullable<typeof rpc.suiResources>["stakes"]) =>
      (groups ?? []).flatMap(g => g.stakes.map(s => ({ ...s, pool: g.stakingPool })));
    const sortStakes = (xs: ReturnType<typeof flat>) =>
      [...xs].sort((a, b) => a.stakedSuiId.localeCompare(b.stakedSuiId));
    const r = sortStakes(flat(rpc.suiResources?.stakes));
    const g = sortStakes(flat(gql.suiResources?.stakes));

    expect(g.length).toBe(r.length);
    // Stake `status` flips Pending→Active at the epoch boundary. Back-to-back syncs ~70s apart
    // can straddle it, so we whitelist that one transition; any other mismatch still fails.
    const isEpochBoundary = (a: StakeObject["status"], b: StakeObject["status"]) =>
      (a === "Pending" && b === "Active") || (a === "Active" && b === "Pending");
    for (let i = 0; i < r.length; i++) {
      expect(g[i].stakedSuiId).toBe(r[i].stakedSuiId);
      expect(g[i].pool).toBe(r[i].pool);
      expect(g[i].principal).toBe(r[i].principal);
      if (g[i].status !== r[i].status) {
        expect(isEpochBoundary(r[i].status, g[i].status)).toBe(true);
      }
    }

    expect(gql.subAccounts).toEqual(rpc.subAccounts);

    // Both arms walk up to `TRANSACTIONS_LIMIT`, but the counts are not required to match: gRPC
    // classifies transaction kinds correctly and so drops SIP-58 settlement transactions that the
    // GraphQL arm keeps. Only non-emptiness is asserted; per-operation identity is covered by
    // `network/sdk.grpc.parity.integ.test.ts`.
    expect(gql.operationsCount ?? 0).toBeGreaterThan(0);
    expect(rpc.operationsCount ?? 0).toBeGreaterThan(0);
  }, 240_000);
});
