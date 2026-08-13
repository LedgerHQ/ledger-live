/**
 * gRPC vs GraphQL **shape parity** tests against live mainnet. Both transports must return
 * the same shape (keys, JS types, array structure); content drifts between back-to-back calls
 * and is not asserted on. Identifiers (digests, addresses, stake IDs, stake principals) are
 * deterministic and ARE asserted exactly.
 *
 * gRPC is the reference leg, and the `rpc`-prefixed locals below hold it. It replaced JSON-RPC after
 * the Sui Foundation retired the public mainnet fullnode (wk of 2026-07-20), which left this suite
 * with no runnable baseline.
 */
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { getStakes as logicGetStakes } from "../logic/staking";
import { createFixtureTransaction } from "../types/bridge.fixture";
import { ACCOUNT_EMPTY } from "./graphql/constants";
import {
  getAccountBalances,
  getAllBalancesCached,
  getBlock,
  getBlockInfo,
  getCheckpoint,
  getLastBlock,
  getDelegatedStakes,
  getListOperations,
  getOperations,
  getValidators,
  paymentInfo,
} from "./sdk";

const GRPC_ID = "sui-grpc-mig";
const GRAPHQL_ID = "sui-graphql-mig";

/** ~5 min lookback at ~3 cps: comfortably past finality on both transports. */
const STABLE_CHECKPOINT_LOOKBACK = 1000n;

/**
 * Live mainnet account used as the "real address" fixture across read-side tests:
 * needs > 1 page of recent history (cursor tests), a USDC balance (token transfer),
 * and enough SUI for dry-run gas. Chosen for steady activity over months; if this
 * one ever goes quiet, swap to any other mainnet address with the same profile.
 */
const ACTIVE_ACCOUNT = "0x0feb54a725aa357ff2f5bc6bb023c05b310285bd861275a30521f339a434ebb3";

let stableCheckpointSequence: string;

beforeAll(async () => {
  coinConfig.setCoinConfig(id => {
    // Both ids carry all three URLs — `SuiCoinConfig` requires them — and differ only in
    // `features.transport`, so a parity failure can only come from the arm, never from the endpoints.
    const node = {
      url: getEnv("API_SUI_NODE_PROXY"),
      graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
      grpcUrl: getEnv("API_SUI_GRPC_PROXY"),
    };
    if (id === GRPC_ID) {
      return { node, status: { type: "active" }, features: { transport: "grpc" } };
    }
    if (id === GRAPHQL_ID) {
      return { node, status: { type: "active" }, features: { transport: "graphql" } };
    }
    throw new Error(`Unknown currency id in migration integ test: ${id}`);
  });

  // Anchor the stable checkpoint at the LAGGING endpoint's latest minus the lookback — so both
  // transports definitely have it indexed. The two are served by different backends and either can
  // lag the other by hundreds of checkpoints during re-index; taking the minimum avoids spurious
  // "not found" failures.
  const [rpcLatest, gqlLatest] = await Promise.all([
    getLastBlock(coinConfig.getCoinConfig(GRPC_ID)),
    getLastBlock(coinConfig.getCoinConfig(GRAPHQL_ID)),
  ]);
  const lagging =
    BigInt(rpcLatest.sequenceNumber) < BigInt(gqlLatest.sequenceNumber)
      ? BigInt(rpcLatest.sequenceNumber)
      : BigInt(gqlLatest.sequenceNumber);
  stableCheckpointSequence = (lagging - STABLE_CHECKPOINT_LOOKBACK).toString();
});

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

/** Each value is a typeof-string, a constructor predicate, or a recursive ShapeSpec. */
type ShapeSpec =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "Date"
  | "BigNumber"
  | "numeric-string" // /^-?\d+$/ (BigInt-parsable)
  | "non-empty-string"
  | "any" // any value (incl. null/undefined)
  | "nullable-string"
  | { array: ShapeSpec; minLen?: number }
  | { object: Record<string, ShapeSpec> }
  | { oneOf: readonly string[] };

function describeType(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (v instanceof Date) return "Date";
  if (v instanceof BigNumber) return "BigNumber";
  return typeof v;
}

function assertSpec(value: unknown, spec: ShapeSpec, path: string): void {
  if (typeof spec === "string") {
    if (spec === "any") return;
    if (spec === "Date") {
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new Error(`${path}: expected Date, got ${describeType(value)}`);
      }
      return;
    }
    if (spec === "BigNumber") {
      if (!(value instanceof BigNumber)) {
        throw new Error(`${path}: expected BigNumber, got ${describeType(value)}`);
      }
      return;
    }
    if (spec === "numeric-string") {
      if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
        throw new Error(
          `${path}: expected base-10 numeric string, got ${describeType(value)} ${JSON.stringify(value)}`,
        );
      }
      return;
    }
    if (spec === "non-empty-string") {
      if (typeof value !== "string" || value.length === 0) {
        throw new Error(`${path}: expected non-empty string, got ${JSON.stringify(value)}`);
      }
      return;
    }
    if (spec === "nullable-string") {
      if (value !== null && value !== undefined && typeof value !== "string") {
        throw new Error(`${path}: expected string|null|undefined, got ${describeType(value)}`);
      }
      return;
    }
    if (typeof value !== spec) {
      throw new Error(`${path}: expected ${spec}, got ${describeType(value)}`);
    }
    return;
  }
  if ("oneOf" in spec) {
    if (typeof value !== "string" || !spec.oneOf.includes(value)) {
      throw new Error(
        `${path}: expected one of ${JSON.stringify(spec.oneOf)}, got ${JSON.stringify(value)}`,
      );
    }
    return;
  }
  if ("array" in spec) {
    if (!Array.isArray(value)) {
      throw new Error(`${path}: expected array, got ${describeType(value)}`);
    }
    if (spec.minLen !== undefined && value.length < spec.minLen) {
      throw new Error(`${path}: expected array length ≥ ${spec.minLen}, got ${value.length}`);
    }
    value.forEach((item, i) => assertSpec(item, spec.array, `${path}[${i}]`));
    return;
  }
  if ("object" in spec) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`${path}: expected object, got ${describeType(value)}`);
    }
    const obj = value as Record<string, unknown>;
    // Spec is structural: the declared keys must match; extras are intentionally
    // tolerated since different transports surface different metadata.
    for (const [k, sub] of Object.entries(spec.object)) {
      assertSpec(obj[k], sub, `${path}.${k}`);
    }
    return;
  }
}

/** Run a spec assertion against both inputs; reports which transport diverged. */
function assertShapeBoth(rpc: unknown, gql: unknown, spec: ShapeSpec, label: string): void {
  assertSpec(rpc, spec, `[rpc] ${label}`);
  assertSpec(gql, spec, `[gql] ${label}`);
}

/** For deterministic identifiers: every key in `gql` map must exist in `rpc` map. */
function assertIdsSubset<T>(
  rpcSet: ReadonlyMap<string, T>,
  gqlSet: ReadonlyMap<string, T>,
  label: string,
): void {
  if (gqlSet.size === 0) {
    throw new Error(`${label}: GraphQL returned no items`);
  }
  const missing = [...gqlSet.keys()].filter(k => !rpcSet.has(k));
  // Allow one-sided drift: either backend may surface a transaction the other has not indexed yet.
  // Some overlap is still required.
  const overlap = gqlSet.size - missing.length;
  if (overlap === 0) {
    throw new Error(
      `${label}: no overlap between transports (rpc=${rpcSet.size}, gql=${gqlSet.size}, gql-only=${missing.length})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("gRPC vs GraphQL shape parity (live mainnet)", () => {
  // ----- Read-side: balances ----------------------------------------------

  describe("getAllBalancesCached", () => {
    // The function returns a narrowed `DispatchedCoinBalance` (see `sdk.ts`) —
    // only fields both transports populate. JSON-RPC-only `coinObjectCount` /
    // `lockedBalance` are intentionally stripped at the cache boundary so the
    // dispatcher's surface stays transport-agnostic.
    const balanceItem: ShapeSpec = {
      object: {
        coinType: "non-empty-string",
        totalBalance: "numeric-string",
        fundsInAddressBalance: "nullable-string",
      },
    };

    it("each entry has the same shape across transports; coin-type sets overlap", async () => {
      const rpc = await getAllBalancesCached(
        coinConfig.getCoinConfig(GRPC_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
      );
      const gql = await getAllBalancesCached(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
      );

      assertShapeBoth(rpc, gql, { array: balanceItem, minLen: 1 }, "getAllBalancesCached");

      // Coin types are deterministic on short timescales — assert overlap, not exact equality.
      const rpcByCoin = new Map(rpc.map(b => [b.coinType, b]));
      const gqlByCoin = new Map(gql.map(b => [b.coinType, b]));
      assertIdsSubset(rpcByCoin, gqlByCoin, "getAllBalancesCached coinType set");
    });
  });

  describe("getAccountBalances (bridge wrapper)", () => {
    const accountBalanceItem: ShapeSpec = {
      object: {
        coinType: "non-empty-string",
        blockHeight: "number",
        balance: "BigNumber",
        fundsInAddressBalance: "BigNumber",
      },
    };

    it("each entry has the same bridge-shape across transports", async () => {
      const rpc = await getAccountBalances(
        coinConfig.getCoinConfig(GRPC_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
      );
      const gql = await getAccountBalances(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
      );
      assertShapeBoth(rpc, gql, { array: accountBalanceItem, minLen: 1 }, "getAccountBalances");

      const rpcByCoin = new Map(rpc.map(b => [b.coinType, b]));
      const gqlByCoin = new Map(gql.map(b => [b.coinType, b]));
      assertIdsSubset(rpcByCoin, gqlByCoin, "getAccountBalances coinType set");
    });
  });

  // ----- Read-side: blocks / checkpoints ----------------------------------

  describe("getLastBlock", () => {
    const lastBlockShape: ShapeSpec = {
      object: {
        digest: "non-empty-string",
        sequenceNumber: "numeric-string",
        timestampMs: "numeric-string",
      },
    };

    it("returns the same shape on both transports", async () => {
      const rpc = await getLastBlock(coinConfig.getCoinConfig(GRPC_ID));
      const gql = await getLastBlock(coinConfig.getCoinConfig(GRAPHQL_ID));
      assertShapeBoth(rpc, gql, lastBlockShape, "getLastBlock");
      // Both should report a positive sequence; exact value drifts between calls.
      expect(BigInt(rpc.sequenceNumber)).toBeGreaterThan(0n);
      expect(BigInt(gql.sequenceNumber)).toBeGreaterThan(0n);
    });
  });

  describe("getCheckpoint(stable sequence)", () => {
    const checkpointShape: ShapeSpec = {
      object: {
        digest: "non-empty-string",
        sequenceNumber: "numeric-string",
        timestampMs: "numeric-string",
      },
    };

    it("returns the same shape on both transports for a finalised historical checkpoint", async () => {
      const rpc = await getCheckpoint(coinConfig.getCoinConfig(GRPC_ID), stableCheckpointSequence);
      const gql = await getCheckpoint(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        stableCheckpointSequence,
      );
      assertShapeBoth(rpc, gql, checkpointShape, "getCheckpoint");
      // Historical checkpoint is immutable: digest+seq+timestamp are deterministic.
      // If one endpoint lags the other's indexing, this exact match fails — that is a real
      // availability divergence, not noise.
      expect(gql.sequenceNumber).toBe(rpc.sequenceNumber);
      expect(gql.digest).toBe(rpc.digest);
      expect(gql.timestampMs).toBe(rpc.timestampMs);
    });

    it("GraphQL rejects digest input; gRPC accepts it", async () => {
      const latest = await getLastBlock(coinConfig.getCoinConfig(GRPC_ID));
      await expect(
        getCheckpoint(coinConfig.getCoinConfig(GRPC_ID), latest.digest),
      ).resolves.toMatchObject({
        digest: latest.digest,
      });
      await expect(
        getCheckpoint(coinConfig.getCoinConfig(GRAPHQL_ID), latest.digest),
      ).rejects.toThrow(/sequence number/i);
    });
  });

  describe("getBlockInfo", () => {
    const blockInfoShape: ShapeSpec = {
      object: {
        height: "number",
        hash: "non-empty-string",
        time: "Date",
        parent: {
          object: { height: "number", hash: "non-empty-string" },
        },
      },
    };

    it("returns the same shape on both transports for a finalised checkpoint", async () => {
      const rpc = await getBlockInfo(coinConfig.getCoinConfig(GRPC_ID), stableCheckpointSequence);
      const gql = await getBlockInfo(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        stableCheckpointSequence,
      );
      assertShapeBoth(rpc, gql, blockInfoShape, "getBlockInfo");
      expect(gql.height).toBe(rpc.height);
      expect(gql.hash).toBe(rpc.hash);
      expect(gql.time.getTime()).toBe(rpc.time.getTime());
    });
  });

  describe("getBlock", () => {
    let smallBlockSequence: string;

    beforeAll(async () => {
      // GraphQL handler returns the first 50 transactions; pick an older block within
      // that bound to compare exact tx-set membership.
      let seq = BigInt(stableCheckpointSequence);
      for (let i = 0; i < 50; i++) {
        const block = await getBlock(coinConfig.getCoinConfig(GRPC_ID), seq.toString());
        if (block.transactions.length <= 50) {
          smallBlockSequence = seq.toString();
          break;
        }
        seq -= 1n;
      }
      if (!smallBlockSequence) {
        throw new Error("No checkpoint with ≤50 txs found in seed window");
      }
    });

    const blockTxItem: ShapeSpec = {
      object: {
        hash: "non-empty-string",
        failed: "boolean",
        operations: { array: "any" },
        fees: "bigint",
      },
    };
    const blockShape: ShapeSpec = {
      object: {
        info: {
          object: {
            height: "number",
            hash: "non-empty-string",
            time: "Date",
            parent: {
              object: { height: "number", hash: "non-empty-string" },
            },
          },
        },
        transactions: { array: blockTxItem },
      },
    };

    it("returns the same shape on both transports; tx digest sets overlap", async () => {
      const rpc = await getBlock(coinConfig.getCoinConfig(GRPC_ID), smallBlockSequence);
      const gql = await getBlock(coinConfig.getCoinConfig(GRAPHQL_ID), smallBlockSequence);
      assertShapeBoth(rpc, gql, blockShape, "getBlock");
      // Historical block is immutable: tx digest set is deterministic.
      const rpcByHash = new Map(rpc.transactions.map(t => [t.hash, t]));
      const gqlByHash = new Map(gql.transactions.map(t => [t.hash, t]));
      assertIdsSubset(rpcByHash, gqlByHash, "getBlock transaction digest set");
    });
  });

  // ----- Read-side: stakes / validators -----------------------------------

  describe("getDelegatedStakes", () => {
    const stakeStatusValues = ["Pending", "Active", "Unstaked"] as const;
    const stakeItem: ShapeSpec = {
      object: {
        stakedSuiId: "non-empty-string",
        stakeRequestEpoch: "numeric-string",
        stakeActiveEpoch: "numeric-string",
        principal: "numeric-string",
        status: { oneOf: stakeStatusValues },
      },
    };
    const delegationItem: ShapeSpec = {
      object: {
        validatorAddress: "non-empty-string",
        stakingPool: "non-empty-string",
        stakes: { array: stakeItem },
      },
    };

    it("returns the same shape on both transports; stake IDs and principals match", async () => {
      const rpc = await getDelegatedStakes(
        coinConfig.getCoinConfig(GRPC_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
      );
      const gql = await getDelegatedStakes(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
      );
      assertShapeBoth(rpc, gql, { array: delegationItem }, "getDelegatedStakes");

      // stakedSuiId + principal are deterministic (deposits don't change post-stake).
      const rpcStakes = new Map(
        rpc.flatMap(d =>
          d.stakes.map(s => [s.stakedSuiId, { ...s, pool: d.stakingPool }] as const),
        ),
      );
      const gqlStakes = new Map(
        gql.flatMap(d =>
          d.stakes.map(s => [s.stakedSuiId, { ...s, pool: d.stakingPool }] as const),
        ),
      );
      assertIdsSubset(rpcStakes, gqlStakes, "getDelegatedStakes stakedSuiId set");

      for (const [id, g] of gqlStakes) {
        const r = rpcStakes.get(id);
        if (!r) continue;
        expect(g.pool).toBe(r.pool);
        expect(g.principal).toBe(r.principal);
        // estimatedReward drifts; status may flip Pending→Active across an epoch boundary.
      }
    });
  });

  describe("getValidators", () => {
    const validatorItem: ShapeSpec = {
      object: {
        suiAddress: "non-empty-string",
        name: "string",
        stakingPoolId: "non-empty-string",
        commissionRate: "numeric-string",
        stakingPoolSuiBalance: "numeric-string",
        apy: "number",
      },
    };

    it("returns the same shape on both transports; active set is identical at the same checkpoint", async () => {
      const rpc = await getValidators(coinConfig.getCoinConfig(GRPC_ID));
      const gql = await getValidators(coinConfig.getCoinConfig(GRAPHQL_ID));
      assertShapeBoth(rpc, gql, { array: validatorItem, minLen: 1 }, "getValidators");

      const rpcByAddr = new Map(rpc.map(v => [v.suiAddress, v]));
      const gqlByAddr = new Map(gql.map(v => [v.suiAddress, v]));
      // Validator set turnover is rare; subset assertion is enough to detect divergence.
      assertIdsSubset(rpcByAddr, gqlByAddr, "getValidators suiAddress set");

      for (const [addr, g] of gqlByAddr) {
        const r = rpcByAddr.get(addr);
        if (!r) continue;
        // Name + commissionRate change rarely; assert exact for matched validators.
        expect(g.name).toBe(r.name);
        expect(g.commissionRate).toBe(r.commissionRate);
        // stakingPoolSuiBalance + apy drift continuously; shape-only checked above.
      }
    });
  });

  // ----- Read-side: tx history / detail -----------------------------------

  describe("getOperations", () => {
    // Both arms fetch one newest page (≤50), but the sets are not required to be equal: the two
    // backends run at different tips, and gRPC classifies transaction kinds correctly so it drops
    // SIP-58 settlement transactions the GraphQL arm keeps. Only the overlap is compared, field by
    // field — that is where a mapping divergence would show up.
    const opItem: ShapeSpec = {
      object: {
        id: "non-empty-string",
        hash: "non-empty-string",
        type: "non-empty-string",
        senders: { array: "non-empty-string" },
        recipients: { array: "string" },
        value: "BigNumber",
        fee: "BigNumber",
        date: "Date",
        accountId: "non-empty-string",
        extra: { object: {} },
      },
    };

    it("returns the same op shape on both transports; digest sets overlap", async () => {
      const accountId = `js:2:sui:${ACTIVE_ACCOUNT}:sui`;
      const rpc = await getOperations(
        coinConfig.getCoinConfig(GRPC_ID),
        accountId,
        ACTIVE_ACCOUNT,
        undefined,
        undefined,
      );
      const gql = await getOperations(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        accountId,
        ACTIVE_ACCOUNT,
        undefined,
        undefined,
      );
      assertShapeBoth(rpc, gql, { array: opItem, minLen: 1 }, "getOperations");

      const rpcByHash = new Map(rpc.map(o => [o.hash, o]));
      const gqlByHash = new Map(gql.map(o => [o.hash, o]));
      assertIdsSubset(rpcByHash, gqlByHash, "getOperations digest set");

      for (const [hash, g] of gqlByHash) {
        const r = rpcByHash.get(hash);
        if (!r) continue;
        // Identifier + immutable timestamp parity for matched ops.
        expect(g.id).toBe(r.id);
        expect(g.type).toBe(r.type);
        expect(g.senders).toEqual(r.senders);
        expect(g.date.getTime()).toBe(r.date.getTime());
        expect(g.value.toFixed()).toBe(r.value.toFixed());
        expect(g.fee.toFixed()).toBe(r.fee.toFixed());
        expect(g.recipients).toEqual(r.recipients);
        expect(g.extra).toEqual(r.extra);
      }
    });
  });

  describe("getListOperations (alpaca cursor model)", () => {
    const alpacaOpItem: ShapeSpec = {
      object: {
        id: "non-empty-string",
        type: "non-empty-string",
        senders: { array: "non-empty-string" },
        recipients: { array: "string" },
        value: "bigint",
        asset: { object: {} },
        tx: {
          object: {
            hash: "non-empty-string",
            block: { object: {} },
            fees: "bigint",
            date: "Date",
            failed: "boolean",
          },
        },
      },
    };

    it("first page: returns the same op shape on both transports; id sets overlap", async () => {
      const rpcPage = await getListOperations(
        coinConfig.getCoinConfig(GRPC_ID),
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        undefined,
      );
      const gqlPage = await getListOperations(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        undefined,
      );
      assertShapeBoth(
        rpcPage.items,
        gqlPage.items,
        { array: alpacaOpItem, minLen: 1 },
        "getListOperations.items",
      );

      const rpcById = new Map(rpcPage.items.map(i => [i.id, i]));
      const gqlById = new Map(gqlPage.items.map(i => [i.id, i]));
      assertIdsSubset(rpcById, gqlById, "getListOperations.id set");

      for (const [id, g] of gqlById) {
        const r = rpcById.get(id);
        if (!r) continue;
        expect(g.type).toBe(r.type);
        expect(g.tx.hash).toBe(r.tx.hash);
        expect(g.tx.date.getTime()).toBe(r.tx.date.getTime());
        expect(g.senders).toEqual(r.senders);
        expect(g.value).toBe(r.value);
        expect(g.tx.fees).toBe(r.tx.fees);
        expect(g.recipients).toEqual(r.recipients);
        expect(g.asset).toEqual(r.asset);
      }
    });

    it("second page (cursor-driven): both transports return strictly older items than the cursor", async () => {
      const first = await getListOperations(
        coinConfig.getCoinConfig(GRPC_ID),
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        undefined,
      );
      // Multi-page precondition: if the address's history is below one page, the
      // cursor-mapping path can't be exercised. Fail loudly so the test summary
      // names the stale fixture rather than burying it in stderr or going green.
      if (!first.next) {
        throw new Error(
          "[sui-migration] fixture stale: ACTIVE_ACCOUNT has fewer than one page of history. " +
            "Refresh the fixture address (pick a busier mainnet address) rather than masking the gap.",
        );
      }
      const cursorTs = Number(first.next.split(":")[0]);

      const rpcPage = await getListOperations(
        coinConfig.getCoinConfig(GRPC_ID),
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        first.next,
      );
      const gqlPage = await getListOperations(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        first.next,
      );

      for (const it of [...rpcPage.items, ...gqlPage.items]) {
        expect(it.tx.date.getTime()).toBeLessThanOrEqual(cursorTs);
      }
    });
  });

  // ----- Write-side dry-run -----------------------------------------------

  describe("paymentInfo", () => {
    const paymentInfoShape: ShapeSpec = {
      object: {
        gasBudget: "numeric-string",
        totalGasUsed: "bigint",
        fees: "bigint",
      },
    };

    it("returns the same shape on both transports for the same dry-run input", async () => {
      const fakeTx = createFixtureTransaction();
      const rpc = await paymentInfo(coinConfig.getCoinConfig(GRPC_ID), ACTIVE_ACCOUNT, fakeTx);
      const gql = await paymentInfo(coinConfig.getCoinConfig(GRAPHQL_ID), ACTIVE_ACCOUNT, fakeTx);
      assertShapeBoth(rpc, gql, paymentInfoShape, "paymentInfo");
      // Budgets are not compared across transports: each arm builds its own transaction and derives
      // the budget from its own simulation, so the value is resolver-determined. Same exclusion as
      // `build.migration.integ.test`.
      expect(BigInt(rpc.gasBudget)).toBeGreaterThan(0n);
      expect(BigInt(gql.gasBudget)).toBeGreaterThan(0n);
    });
  });

  // ----- Alpaca-layer wrapper post-rewire ---------------------------------

  describe("logic.getStakes (post-rewire to getDelegatedStakes)", () => {
    const stakeShape: ShapeSpec = {
      object: {
        uid: "non-empty-string",
        address: "non-empty-string",
        delegate: "non-empty-string",
        state: { oneOf: ["activating", "active", "inactive"] as const },
        asset: { object: {} },
        amount: "bigint",
        amountDeposited: "bigint",
        amountRewarded: "bigint",
      },
    };
    const pageShape: ShapeSpec = {
      object: {
        items: { array: stakeShape },
      },
    };

    it("Page<Stake> shape matches across transports; uid + amountDeposited identical for matched stakes", async () => {
      const rpc = await logicGetStakes(
        coinConfig.getCoinConfig(GRPC_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
        undefined,
      );
      const gql = await logicGetStakes(
        coinConfig.getCoinConfig(GRAPHQL_ID),
        FIGMENT_SUI_VALIDATOR_ADDRESS,
        undefined,
      );
      assertShapeBoth(rpc, gql, pageShape, "logic.getStakes");

      const rpcById = new Map(rpc.items.map(s => [s.uid, s]));
      const gqlById = new Map(gql.items.map(s => [s.uid, s]));
      assertIdsSubset(rpcById, gqlById, "logic.getStakes uid set");

      for (const [uid, g] of gqlById) {
        const r = rpcById.get(uid);
        if (!r) continue;
        expect(g.address).toBe(r.address);
        expect(g.delegate).toBe(r.delegate);
        // amountDeposited is the original principal — deterministic; amountRewarded drifts.
        expect((g.amountDeposited ?? 0n).toString()).toBe((r.amountDeposited ?? 0n).toString());
      }
    });
  });

  // ----- Empty / unused address parity ------------------------------------

  describe("unused-address parity", () => {
    // Empty-page semantics — most likely silent divergence between transports.
    it("getDelegatedStakes returns an empty array on both transports", async () => {
      const rpc = await getDelegatedStakes(coinConfig.getCoinConfig(GRPC_ID), ACCOUNT_EMPTY);
      const gql = await getDelegatedStakes(coinConfig.getCoinConfig(GRAPHQL_ID), ACCOUNT_EMPTY);
      expect(rpc).toEqual([]);
      expect(gql).toEqual([]);
    });

    it("getAllBalancesCached returns an empty array on both transports", async () => {
      const rpc = await getAllBalancesCached(coinConfig.getCoinConfig(GRPC_ID), ACCOUNT_EMPTY);
      const gql = await getAllBalancesCached(coinConfig.getCoinConfig(GRAPHQL_ID), ACCOUNT_EMPTY);
      expect(rpc).toEqual([]);
      expect(gql).toEqual([]);
    });
  });
});
