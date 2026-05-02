import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { ACCOUNT_EMPTY, GRAPHQL_MAINNET_URL } from "./graphql/constants";
import {
  getAccountBalances,
  getAllBalancesCached,
  getCheckpoint,
  getLastBlock,
  getStakesRaw,
  getValidators,
} from "./sdk";

const JSON_RPC_ID = "sui-jsonrpc-mig";
const GRAPHQL_ID = "sui-graphql-mig";

const JSON_RPC_URL = getJsonRpcFullnodeUrl("mainnet");

/**
 * Lookback for the parity checkpoint. Two constraints: past finality
 * across both transports (digests/timestamps stable between reads a few
 * seconds apart) and well within the GraphQL retention window.
 * 1000 checkpoints ≈ 5 minutes at ~3 cps.
 */
const STABLE_CHECKPOINT_LOOKBACK = 1000n;

const TOLERANCE = {
  /** Max checkpoint-sequence delta between transports for `getLastBlock`; chain advances ~3 cps. */
  lastBlockSequenceWindow: 100n,
  /** `getStakesRaw` reward parity: 1 % relative or 0.0001 SUI absolute floor (whichever larger). */
  stakeRewardAbsoluteMist: 100_000n,
  stakeRewardRelativeBps: 100n,
  /** Max `stakeRequestEpoch` delta — GraphQL derives it as `activeEpoch − 1`. */
  stakeRequestEpochDelta: 1,
  /** APY drift between JSON-RPC indexer and our 30-epoch live snapshot — see `getValidators`. */
  validatorApyAbsolute: 0.05,
} as const;

// Resolved at suite startup against the live JSON-RPC endpoint — see
// STABLE_CHECKPOINT_LOOKBACK above for the rationale.
let stableCheckpointSequence: string;

beforeAll(async () => {
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
        node: { url: GRAPHQL_MAINNET_URL },
        status: { type: "active" },
        features: { graphql: true },
      };
    }
    throw new Error(`Unknown currency id in migration integ test: ${id}`);
  });

  const latest = await getLastBlock(JSON_RPC_ID);
  stableCheckpointSequence = (
    BigInt(latest.sequenceNumber) - STABLE_CHECKPOINT_LOOKBACK
  ).toString();
});

/**
 * BigInt-equivalent compare with absolute and relative tolerances —
 * for `estimatedReward` and APY-derived fields where server and
 * client do the same math but may round differently.
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
  const relTol = ((e < 0n ? -e : e) * relativeBps) / 10_000n;
  const tol = relTol > absolute ? relTol : absolute;
  if (diff > tol) {
    throw new Error(`expectClose: actual=${a} expected=${e} diff=${diff} tolerance=${tol}`);
  }
}

describe("JSON-RPC vs GraphQL parity (live mainnet)", () => {
  describe("getAllBalancesCached", () => {
    test("balances match across transports", async () => {
      const rpc = await getAllBalancesCached(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getAllBalancesCached(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

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
        // `coinObjectCount` and `lockedBalance` are GraphQL gaps —
        // intentionally NOT compared. See `getAllBalancesCached` in `sdk.ts`.
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

      // Chain advances ~3 cps between calls; window covers latency + retries.
      const a = BigInt(rpc.sequenceNumber);
      const b = BigInt(gql.sequenceNumber);
      const diff = a > b ? a - b : b - a;
      expect(diff).toBeLessThan(TOLERANCE.lastBlockSequenceWindow);

      // timestampMs should be a parseable epoch-millis string
      expect(Number.isFinite(Number(rpc.timestampMs))).toBe(true);
      expect(Number.isFinite(Number(gql.timestampMs))).toBe(true);
    });
  });

  describe("getCheckpoint(stable sequence)", () => {
    test("digest, sequenceNumber, timestampMs match exactly for a finalised historical checkpoint", async () => {
      const rpc = await getCheckpoint(stableCheckpointSequence, JSON_RPC_ID);
      const gql = await getCheckpoint(stableCheckpointSequence, GRAPHQL_ID);

      expect(gql.digest).toBe(rpc.digest);
      expect(gql.sequenceNumber).toBe(rpc.sequenceNumber);
      expect(gql.timestampMs).toBe(rpc.timestampMs);
    });

    test("GraphQL rejects digest input; JSON-RPC accepts it", async () => {
      // sdk.ts:1769 throws on the GraphQL path when `id` is a digest
      // because `Query.checkpoint(sequenceNumber:)` can't accept digests.
      // JSON-RPC accepts both. Asserting the asymmetry live protects the
      // guard against being silently relaxed (or a future GraphQL schema
      // change that would mis-route).
      const latest = await getLastBlock(JSON_RPC_ID);
      await expect(getCheckpoint(latest.digest, JSON_RPC_ID)).resolves.toMatchObject({
        digest: latest.digest,
      });
      await expect(getCheckpoint(latest.digest, GRAPHQL_ID)).rejects.toThrow(/sequence number/i);
    });
  });

  describe("getStakesRaw", () => {
    test("delegated stakes group, status, principal match; estimatedReward within tolerance", async () => {
      const rpc = await getStakesRaw(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getStakesRaw(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

      const sortGroups = (xs: typeof rpc) =>
        [...xs].sort((a, b) => a.stakingPool.localeCompare(b.stakingPool));
      const r = sortGroups(rpc);
      const g = sortGroups(gql);

      expect(g.length).toBe(r.length);

      for (let i = 0; i < r.length; i++) {
        expect(g[i].stakingPool).toBe(r[i].stakingPool);
        expect(g[i].validatorAddress).toBe(r[i].validatorAddress);

        const sortStakes = (xs: (typeof r)[number]["stakes"]) =>
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
          expect(reqDiff).toBeLessThanOrEqual(TOLERANCE.stakeRequestEpochDelta);

          // Active stake reward — both compute via the same pool-token
          // exchange-rate formula but may round differently.
          if (gStake.status === "Active" && rStake.status === "Active") {
            expectClose(gStake.estimatedReward, rStake.estimatedReward, {
              absolute: TOLERANCE.stakeRewardAbsoluteMist,
              relativeBps: TOLERANCE.stakeRewardRelativeBps,
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
        // snapshot live. Tolerance covers observed drift with headroom
        // for occasional reward-event skew at epoch boundaries.
        if (Number.isFinite(r[i].apy) && Number.isFinite(g[i].apy)) {
          expect(Math.abs(g[i].apy - r[i].apy)).toBeLessThan(TOLERANCE.validatorApyAbsolute);
        }
      }
    });
  });

  describe("getAccountBalances (bridge wrapper)", () => {
    // Wrapper around `getAllBalancesCached` (sdk.ts:588) — does the field
    // rename + BigNumber conversion the bridge consumes via
    // synchronisation.ts:55. Its dual-path behaviour is inherited from
    // `getAllBalancesCached`, but we assert the bridge-shaped output here
    // so any future divergence in the wrapper itself surfaces immediately.
    test("balances match across transports as consumed by the bridge", async () => {
      const rpc = await getAccountBalances(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getAccountBalances(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

      const sort = (xs: typeof rpc) => [...xs].sort((a, b) => a.coinType.localeCompare(b.coinType));
      const r = sort(rpc);
      const g = sort(gql);

      expect(g.length).toBe(r.length);
      for (let i = 0; i < r.length; i++) {
        expect(g[i].coinType).toBe(r[i].coinType);
        expect(g[i].balance.toFixed()).toBe(r[i].balance.toFixed());
        expect(g[i].fundsInAddressBalance.toFixed()).toBe(r[i].fundsInAddressBalance.toFixed());
      }
    });
  });

  describe("unused-address parity", () => {
    // Empty / zero-result code path. The fixture address has stakes and
    // multi-token balances, so it never exercises an empty page response.
    // GraphQL pagination empty-page semantics are the path most likely
    // to diverge silently from JSON-RPC for fresh accounts.
    test("getStakesRaw returns equivalent results across transports for an unused address", async () => {
      const rpc = await getStakesRaw(ACCOUNT_EMPTY, JSON_RPC_ID);
      const gql = await getStakesRaw(ACCOUNT_EMPTY, GRAPHQL_ID);
      expect(gql).toEqual(rpc);
    });

    test("getAllBalancesCached returns equivalent results across transports for an unused address", async () => {
      const rpc = await getAllBalancesCached(ACCOUNT_EMPTY, JSON_RPC_ID);
      const gql = await getAllBalancesCached(ACCOUNT_EMPTY, GRAPHQL_ID);

      const sort = (xs: typeof rpc) => [...xs].sort((a, b) => a.coinType.localeCompare(b.coinType));
      const r = sort(rpc);
      const g = sort(gql);

      expect(g.length).toBe(r.length);
      for (let i = 0; i < r.length; i++) {
        expect(g[i].coinType).toBe(r[i].coinType);
        expect(g[i].totalBalance).toBe(r[i].totalBalance);
        expect(g[i].fundsInAddressBalance ?? "0").toBe(r[i].fundsInAddressBalance ?? "0");
      }
    });
  });
});
