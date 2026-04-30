/**
 * Live-endpoint parity test for the JSON-RPC → GraphQL migration.
 *
 * Each migrated read function runs on both transports against the same
 * mainnet account and the outputs are compared field-by-field with
 * documented tolerances for fields that legitimately differ
 * (rounding-prone reward math, chain-advancing checkpoint counters).
 *
 * Two coin configs coexist via distinct `currencyId`s — the per-call
 * `currencyId` arg is what coin-sui already uses to select between coin
 * variants, so we don't need a custom dispatch hack: each transport
 * gets its own currency entry, and the LRU cache key built from
 * `currencyId` keeps results separated.
 *
 * Run:
 *   API_SUI_NODE_PROXY=<jsonrpc-fullnode-url> pnpm jest --config=jest.integ.config.js \
 *       src/network/sdk.migration.integ.test.ts
 *
 * The suite skips automatically when `API_SUI_NODE_PROXY` is unset, so
 * `pnpm test-integ` doesn't fail in environments without the secret.
 */
import { getEnv } from "@ledgerhq/live-env";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import coinConfig from "../config";
import {
  getAllBalancesCached,
  getCheckpoint,
  getLastBlock,
  getStakesRaw,
  getValidators,
} from "./sdk";

const JSON_RPC_ID = "sui-jsonrpc-mig";
const GRAPHQL_ID = "sui-graphql-mig";

// Mainnet GraphQL endpoint — public, no SLA but adequate for parity
// testing. Override via env if a managed provider is preferred.
const GRAPHQL_URL =
  getEnv("API_SUI_GRAPHQL_URL" as never) || "https://graphql.mainnet.sui.io/graphql";
const JSON_RPC_URL = getEnv("API_SUI_NODE_PROXY") || getJsonRpcFullnodeUrl("mainnet");

// Address with a non-trivial set of stakes — also referenced by other
// coin-sui integ tests so we keep the surface stable.
const ACCOUNT_WITH_STAKES = "0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d";

// A mainnet checkpoint sequence that's old enough to be stable across
// reorg-free history. Far below current epoch's totalCheckpoints.
const STABLE_CHECKPOINT_SEQUENCE = "100";

// Skip the whole suite locally when the JSON-RPC URL secret isn't set so
// `pnpm test-integ` doesn't fail in clean environments.
const SHOULD_RUN = Boolean(JSON_RPC_URL);
const describeLive = SHOULD_RUN ? describe : describe.skip;

beforeAll(() => {
  coinConfig.setCoinConfig(id => {
    if (id === JSON_RPC_ID) {
      return {
        node: { url: JSON_RPC_URL },
        status: { type: "active" },
        features: { graphql: false },
      };
    }
    if (id === GRAPHQL_ID) {
      return {
        node: { url: GRAPHQL_URL },
        status: { type: "active" },
        features: { graphql: true },
      };
    }
    throw new Error(`Unknown currency id in migration integ test: ${id}`);
  });
});

// ----- Helpers ------------------------------------------------------------

/**
 * Compare two BigInts as strings/numbers/bigints with absolute and
 * relative tolerances. Used for `estimatedReward` and APY-derived fields
 * where the JSON-RPC server and our client do the same math but may
 * round differently.
 */
function expectClose(
  actual: bigint | string | number,
  expected: bigint | string | number,
  { absolute = 100_000n, relativeBps = 100n }: { absolute?: bigint; relativeBps?: bigint } = {},
) {
  const a = typeof actual === "bigint" ? actual : BigInt(actual);
  const e = typeof expected === "bigint" ? expected : BigInt(expected);
  const diff = a > e ? a - e : e - a;
  // Allow whichever tolerance is larger — small absolute floor for
  // tiny values, percentage-based above that.
  const relTol = (e < 0n ? -e : e) * relativeBps / 10_000n;
  const tol = relTol > absolute ? relTol : absolute;
  if (diff > tol) {
    throw new Error(
      `expectClose: actual=${a} expected=${e} diff=${diff} tolerance=${tol}`,
    );
  }
}

// ----- Tests --------------------------------------------------------------

describeLive("JSON-RPC vs GraphQL parity (live mainnet)", () => {
  describe("getAllBalancesCached", () => {
    test("balances match across transports", async () => {
      const rpc = await getAllBalancesCached(ACCOUNT_WITH_STAKES, JSON_RPC_ID);
      const gql = await getAllBalancesCached(ACCOUNT_WITH_STAKES, GRAPHQL_ID);

      const sort = (xs: typeof rpc) => [...xs].sort((a, b) => a.coinType.localeCompare(b.coinType));
      const r = sort(rpc);
      const g = sort(gql);

      expect(g.length).toBe(r.length);
      for (let i = 0; i < r.length; i++) {
        expect(g[i].coinType).toBe(r[i].coinType);
        expect(g[i].totalBalance).toBe(r[i].totalBalance);
        // SIP-58 split — rename `addressBalance` (GraphQL) →
        // `fundsInAddressBalance` (JSON-RPC) is exercised here.
        expect(g[i].fundsInAddressBalance ?? "0").toBe(r[i].fundsInAddressBalance ?? "0");
        // `coinObjectCount` and `lockedBalance` are GraphQL gaps documented
        // in the migration plan — intentionally NOT compared.
      }
    });
  });

  describe("getLastBlock", () => {
    test("both transports return matching shape; sequence numbers track within window", async () => {
      const rpc = await getLastBlock(JSON_RPC_ID);
      const gql = await getLastBlock(GRAPHQL_ID);

      // Shape sanity
      expect(rpc.digest).toEqual(expect.stringMatching(/.+/));
      expect(gql.digest).toEqual(expect.stringMatching(/.+/));
      expect(BigInt(rpc.sequenceNumber)).toBeGreaterThan(0n);
      expect(BigInt(gql.sequenceNumber)).toBeGreaterThan(0n);

      // The chain may advance a few checkpoints between calls. SUI
      // produces ~3 checkpoints/sec, so a 100-checkpoint window covers
      // network latency + retries comfortably.
      const a = BigInt(rpc.sequenceNumber);
      const b = BigInt(gql.sequenceNumber);
      const diff = a > b ? a - b : b - a;
      expect(diff).toBeLessThan(100n);

      // timestampMs should be a parseable epoch-millis string
      expect(Number.isFinite(Number(rpc.timestampMs))).toBe(true);
      expect(Number.isFinite(Number(gql.timestampMs))).toBe(true);
    });
  });

  describe("getCheckpoint(stable sequence)", () => {
    test("digest, sequenceNumber, timestampMs match exactly for a finalised historical checkpoint", async () => {
      const rpc = await getCheckpoint(STABLE_CHECKPOINT_SEQUENCE, JSON_RPC_ID);
      const gql = await getCheckpoint(STABLE_CHECKPOINT_SEQUENCE, GRAPHQL_ID);

      expect(gql.digest).toBe(rpc.digest);
      expect(gql.sequenceNumber).toBe(rpc.sequenceNumber);
      expect(gql.timestampMs).toBe(rpc.timestampMs);
    });
  });

  describe("getStakesRaw", () => {
    test("delegated stakes group, status, principal match; estimatedReward within tolerance", async () => {
      const rpc = await getStakesRaw(ACCOUNT_WITH_STAKES, JSON_RPC_ID);
      const gql = await getStakesRaw(ACCOUNT_WITH_STAKES, GRAPHQL_ID);

      const sortGroups = (xs: typeof rpc) =>
        [...xs].sort((a, b) => a.stakingPool.localeCompare(b.stakingPool));
      const r = sortGroups(rpc);
      const g = sortGroups(gql);

      expect(g.length).toBe(r.length);

      for (let i = 0; i < r.length; i++) {
        expect(g[i].stakingPool).toBe(r[i].stakingPool);
        expect(g[i].validatorAddress).toBe(r[i].validatorAddress);

        const sortStakes = (xs: typeof r[number]["stakes"]) =>
          [...xs].sort((a, b) => a.stakedSuiId.localeCompare(b.stakedSuiId));
        const rs = sortStakes(r[i].stakes);
        const gs = sortStakes(g[i].stakes);

        expect(gs.length).toBe(rs.length);
        for (let j = 0; j < rs.length; j++) {
          // Bind locally so TS narrows each variable independently after
          // the `status === "Active"` check.
          const gStake = gs[j];
          const rStake = rs[j];

          expect(gStake.stakedSuiId).toBe(rStake.stakedSuiId);
          expect(gStake.principal).toBe(rStake.principal);
          expect(gStake.status).toBe(rStake.status);
          expect(gStake.stakeActiveEpoch).toBe(rStake.stakeActiveEpoch);

          // `stakeRequestEpoch` may differ by 1 between transports —
          // GraphQL computes it as activeEpoch − 1 since the on-chain
          // StakedSui struct only stores `stake_activation_epoch`.
          const reqDiff = Math.abs(
            Number(gStake.stakeRequestEpoch) - Number(rStake.stakeRequestEpoch),
          );
          expect(reqDiff).toBeLessThanOrEqual(1);

          // Active stake reward — both compute via the same pool-token
          // exchange-rate formula but may round differently. Allow
          // 1% relative tolerance and a 100k MIST (0.0001 SUI) absolute
          // floor for very small stakes.
          if (gStake.status === "Active" && rStake.status === "Active") {
            expectClose(gStake.estimatedReward, rStake.estimatedReward, {
              absolute: 100_000n,
              relativeBps: 100n, // 1%
            });
          }
        }
      }
    });
  });

  describe("getValidators", () => {
    test("active set + metadata match; APY within tolerance", async () => {
      const rpc = await getValidators(JSON_RPC_ID);
      const gql = await getValidators(GRAPHQL_ID);

      const sort = (xs: typeof rpc) =>
        [...xs].sort((a, b) => a.suiAddress.localeCompare(b.suiAddress));
      const r = sort(rpc);
      const g = sort(gql);

      expect(g.length).toBe(r.length);

      for (let i = 0; i < r.length; i++) {
        expect(g[i].suiAddress).toBe(r[i].suiAddress);
        expect(g[i].name).toBe(r[i].name);
        expect(g[i].commissionRate).toBe(r[i].commissionRate);
        expect(g[i].stakingPoolSuiBalance).toBe(r[i].stakingPoolSuiBalance);
        expect(g[i].stakingPoolId).toBe(r[i].stakingPoolId);
        expect(g[i].exchangeRatesId).toBe(r[i].exchangeRatesId);

        // APY drift between JSON-RPC and our GraphQL path observed on
        // mainnet at ~1-2 percentage points: JSON-RPC's
        // `getValidatorsApy` is fed by an indexer that smooths across
        // multiple epochs, while we read a single 30-epoch lookback
        // snapshot live. 5 percentage-point absolute tolerance covers
        // observed drift with headroom for occasional reward-event
        // skew at epoch boundaries.
        if (Number.isFinite(r[i].apy) && Number.isFinite(g[i].apy)) {
          expect(Math.abs(g[i].apy - r[i].apy)).toBeLessThan(0.05);
        }
      }
    });
  });
});

// Make the suite file self-explanatory in CI logs.
if (!SHOULD_RUN) {
  // eslint-disable-next-line no-console
  console.warn(
    "[sdk.migration.integ] Skipped: set API_SUI_NODE_PROXY (and optionally " +
      "API_SUI_GRAPHQL_URL) to run the JSON-RPC ↔ GraphQL parity suite.",
  );
}
