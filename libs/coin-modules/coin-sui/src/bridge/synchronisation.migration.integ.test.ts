import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { GRAPHQL_MAINNET_URL } from "../network/graphql/constants";
import { getAccountShape } from "./synchronisation";

const JSON_RPC_URL = getJsonRpcFullnodeUrl("mainnet");

let useGraphQL = false;

beforeAll(() => {
  setCryptoAssetsStore({
    findTokenByAddressInCurrency: async () => undefined,
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "0",
  } as unknown as CryptoAssetsStore);

  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    node: { url: useGraphQL ? GRAPHQL_MAINNET_URL : JSON_RPC_URL },
    features: { graphql: useGraphQL },
  }));
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

describe("getAccountShape: JSON-RPC vs GraphQL parity (live mainnet)", () => {
  test("balance, spendable and suiResources.stakes match across transports", async () => {
    useGraphQL = false;
    const rpc = await getAccountShape(SHAPE_INFO, SYNC_CONFIG);

    useGraphQL = true;
    const gql = await getAccountShape(SHAPE_INFO, SYNC_CONFIG);

    expect(gql.balance!.toFixed()).toBe(rpc.balance!.toFixed());
    expect(gql.spendableBalance!.toFixed()).toBe(rpc.spendableBalance!.toFixed());
    expect(gql.blockHeight).toBe(rpc.blockHeight);

    // Stakes — composed from `getStakesRaw` and stored in
    // `suiResources.stakes`, the surface the UI hook
    // `useSuiMappedStakingPositions` reads. Reward drift is exercised
    // at the SDK layer; here we only need stable identity + principal
    // + status to assert the bridge didn't reorder or drop anything.
    const flat = (groups: NonNullable<typeof rpc.suiResources>["stakes"]) =>
      (groups ?? []).flatMap(g => g.stakes.map(s => ({ ...s, pool: g.stakingPool })));
    const sortStakes = (xs: ReturnType<typeof flat>) =>
      [...xs].sort((a, b) => a.stakedSuiId.localeCompare(b.stakedSuiId));
    const r = sortStakes(flat(rpc.suiResources?.stakes));
    const g = sortStakes(flat(gql.suiResources?.stakes));

    expect(g.length).toBe(r.length);
    for (let i = 0; i < r.length; i++) {
      expect(g[i].stakedSuiId).toBe(r[i].stakedSuiId);
      expect(g[i].pool).toBe(r[i].pool);
      expect(g[i].principal).toBe(r[i].principal);
      expect(g[i].status).toBe(r[i].status);
    }

    expect(gql.subAccounts).toEqual(rpc.subAccounts);

    // Operations come from `getOperations`, which is JSON-RPC only on
    // both runs today (sdk.ts:1451). Sanity check the count is in the
    // same ballpark — strict equality is impossible because new
    // mainnet ops can land between the two reads.
    expect(Math.abs((gql.operationsCount ?? 0) - (rpc.operationsCount ?? 0))).toBeLessThanOrEqual(
      2,
    );
  });
});
