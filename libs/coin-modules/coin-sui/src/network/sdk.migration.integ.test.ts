import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { ACCOUNT_EMPTY, GRAPHQL_MAINNET_URL } from "./graphql/constants";
import {
  getAccountBalances,
  getAllBalancesCached,
  getCheckpoint,
  getLastBlock,
  getDelegatedStakes,
} from "./sdk";

const JSON_RPC_ID = "sui-jsonrpc-mig";
const GRAPHQL_ID = "sui-graphql-mig";

const JSON_RPC_URL = getJsonRpcFullnodeUrl("mainnet");

/** ~5 min lookback at ~3 cps: past finality on both transports, inside the GraphQL retention window. */
const STABLE_CHECKPOINT_LOOKBACK = 1000n;

const TOLERANCE = {
  /** Max checkpoint-sequence delta between transports for `getLastBlock`; chain advances ~3 cps. */
  lastBlockSequenceWindow: 100n,
  /** `getDelegatedStakes` reward parity: 1 % relative or 0.0001 SUI absolute floor (whichever larger). */
  stakeRewardAbsoluteMist: 100_000n,
  stakeRewardRelativeBps: 100n,
  /** Max `stakeRequestEpoch` delta — GraphQL derives it as `activeEpoch − 1`. */
  stakeRequestEpochDelta: 1,
} as const;

// Resolved at suite startup against the live JSON-RPC endpoint.
let stableCheckpointSequence: string;

beforeAll(async () => {
  coinConfig.setCoinConfig(id => {
    if (id === JSON_RPC_ID) {
      return {
        node: { url: JSON_RPC_URL, graphqlUrl: GRAPHQL_MAINNET_URL },
        status: { type: "active" },
        features: { graphql: false },
      };
    }
    if (id === GRAPHQL_ID) {
      return {
        node: { url: JSON_RPC_URL, graphqlUrl: GRAPHQL_MAINNET_URL },
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

/** BigInt compare with abs+relative tolerance for fields where transports do the same math but round differently. */
function expectClose(
  actual: bigint | string | number,
  expected: bigint | string | number,
  {
    absolute = TOLERANCE.stakeRewardAbsoluteMist,
    relativeBps = TOLERANCE.stakeRewardRelativeBps,
  }: { absolute?: bigint; relativeBps?: bigint } = {},
) {
  const a = typeof actual === "bigint" ? actual : BigInt(actual);
  const e = typeof expected === "bigint" ? expected : BigInt(expected);
  const diff = a > e ? a - e : e - a;
  // Whichever tolerance is larger — absolute floor catches tiny values, percentage above.
  const relTol = ((e < 0n ? -e : e) * relativeBps) / 10_000n;
  const tol = relTol > absolute ? relTol : absolute;
  if (diff > tol) {
    throw new Error(`expectClose: actual=${a} expected=${e} diff=${diff} tolerance=${tol}`);
  }
}

/** Sort both sides by `key`, assert length, run `assertPair` per index; per-test contract stays in the lambda. */
function assertParityList<T>(
  rpc: ReadonlyArray<T>,
  gql: ReadonlyArray<T>,
  key: (x: T) => string,
  assertPair: (gqlItem: T, rpcItem: T, index: number) => void,
) {
  const cmp = (xs: ReadonlyArray<T>) => [...xs].sort((a, b) => key(a).localeCompare(key(b)));
  const r = cmp(rpc);
  const g = cmp(gql);
  expect(g.length).toBe(r.length);
  for (let i = 0; i < r.length; i++) assertPair(g[i], r[i], i);
}

describe("JSON-RPC vs GraphQL parity (live mainnet)", () => {
  describe("getAllBalancesCached", () => {
    it("balances match across transports", async () => {
      const rpc = await getAllBalancesCached(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getAllBalancesCached(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

      assertParityList(
        rpc,
        gql,
        x => x.coinType,
        (g, r) => {
          expect(g.coinType).toBe(r.coinType);
          expect(g.totalBalance).toBe(r.totalBalance);
          // SIP-58 `addressBalance` → `fundsInAddressBalance` rename exercised here.
          expect(g.fundsInAddressBalance ?? "0").toBe(r.fundsInAddressBalance ?? "0");
          // `coinObjectCount` and `lockedBalance` are GraphQL gaps — intentionally not compared.
        },
      );
    });
  });

  describe("getLastBlock", () => {
    it("both transports return matching shape; sequence numbers track within window", async () => {
      const rpc = await getLastBlock(JSON_RPC_ID);
      const gql = await getLastBlock(GRAPHQL_ID);

      expect(rpc.digest).toEqual(expect.stringMatching(/.+/));
      expect(gql.digest).toEqual(expect.stringMatching(/.+/));
      expect(BigInt(rpc.sequenceNumber)).toBeGreaterThan(0n);
      expect(BigInt(gql.sequenceNumber)).toBeGreaterThan(0n);

      // Chain advances ~3 cps between calls; window covers latency + retries.
      const a = BigInt(rpc.sequenceNumber);
      const b = BigInt(gql.sequenceNumber);
      const diff = a > b ? a - b : b - a;
      expect(diff).toBeLessThan(TOLERANCE.lastBlockSequenceWindow);

      expect(Number.isFinite(Number(rpc.timestampMs))).toBe(true);
      expect(Number.isFinite(Number(gql.timestampMs))).toBe(true);
    });
  });

  describe("getCheckpoint(stable sequence)", () => {
    it("digest, sequenceNumber, timestampMs match exactly for a finalised historical checkpoint", async () => {
      const rpc = await getCheckpoint(stableCheckpointSequence, JSON_RPC_ID);
      const gql = await getCheckpoint(stableCheckpointSequence, GRAPHQL_ID);

      expect(gql.digest).toBe(rpc.digest);
      expect(gql.sequenceNumber).toBe(rpc.sequenceNumber);
      expect(gql.timestampMs).toBe(rpc.timestampMs);
    });

    it("GraphQL rejects digest input; JSON-RPC accepts it", async () => {
      // Live-asserts the dispatcher's digest guard so it can't be silently relaxed.
      const latest = await getLastBlock(JSON_RPC_ID);
      await expect(getCheckpoint(latest.digest, JSON_RPC_ID)).resolves.toMatchObject({
        digest: latest.digest,
      });
      await expect(getCheckpoint(latest.digest, GRAPHQL_ID)).rejects.toThrow(/sequence number/i);
    });
  });

  describe("getDelegatedStakes", () => {
    it("delegated stakes group, status, principal match; estimatedReward within tolerance", async () => {
      const rpc = await getDelegatedStakes(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getDelegatedStakes(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

      assertParityList(
        rpc,
        gql,
        x => x.stakingPool,
        (g, r) => {
          expect(g.stakingPool).toBe(r.stakingPool);
          expect(g.validatorAddress).toBe(r.validatorAddress);

          assertParityList(
            r.stakes,
            g.stakes,
            s => s.stakedSuiId,
            (gStake, rStake) => {
              expect(gStake.stakedSuiId).toBe(rStake.stakedSuiId);
              expect(gStake.principal).toBe(rStake.principal);
              expect(gStake.status).toBe(rStake.status);
              expect(gStake.stakeActiveEpoch).toBe(rStake.stakeActiveEpoch);

              // GraphQL derives `stakeRequestEpoch` as `activeEpoch − 1`; transports may differ by 1.
              const reqDiff = Math.abs(
                Number(gStake.stakeRequestEpoch) - Number(rStake.stakeRequestEpoch),
              );
              expect(reqDiff).toBeLessThanOrEqual(TOLERANCE.stakeRequestEpochDelta);

              // Same pool-token formula on both sides; integer-division rounding may differ.
              if (gStake.status === "Active" && rStake.status === "Active") {
                expectClose(gStake.estimatedReward, rStake.estimatedReward);
              }
            },
          );
        },
      );
    });
  });

  describe("getAccountBalances (bridge wrapper)", () => {
    // Asserts the bridge-shaped output so divergence in the wrapper itself surfaces here.
    it("balances match across transports as consumed by the bridge", async () => {
      const rpc = await getAccountBalances(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getAccountBalances(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

      assertParityList(
        rpc,
        gql,
        x => x.coinType,
        (g, r) => {
          expect(g.coinType).toBe(r.coinType);
          expect(g.balance.toFixed()).toBe(r.balance.toFixed());
          expect(g.fundsInAddressBalance.toFixed()).toBe(r.fundsInAddressBalance.toFixed());
        },
      );
    });
  });

  describe("unused-address parity", () => {
    // Empty-page semantics are the most likely silent divergence between transports.
    it("getDelegatedStakes returns equivalent results across transports for an unused address", async () => {
      const rpc = await getDelegatedStakes(ACCOUNT_EMPTY, JSON_RPC_ID);
      const gql = await getDelegatedStakes(ACCOUNT_EMPTY, GRAPHQL_ID);
      expect(gql).toEqual(rpc);
    });

    it("getAllBalancesCached returns equivalent results across transports for an unused address", async () => {
      const rpc = await getAllBalancesCached(ACCOUNT_EMPTY, JSON_RPC_ID);
      const gql = await getAllBalancesCached(ACCOUNT_EMPTY, GRAPHQL_ID);

      assertParityList(
        rpc,
        gql,
        x => x.coinType,
        (g, r) => {
          expect(g.coinType).toBe(r.coinType);
          expect(g.totalBalance).toBe(r.totalBalance);
          expect(g.fundsInAddressBalance ?? "0").toBe(r.fundsInAddressBalance ?? "0");
        },
      );
    });
  });
});
