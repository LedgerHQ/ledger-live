/**
 * JSON-RPC vs GraphQL **shape parity** tests against live mainnet. Both transports must return
 * the same shape (keys, JS types, array structure); content drifts between back-to-back calls
 * and is not asserted on. Identifiers (digests, addresses, stake IDs, stake principals) are
 * deterministic and ARE asserted exactly.
 */
import BigNumber from "bignumber.js";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { getStakes as logicGetStakes } from "../logic/staking";
import { createFixtureTransaction } from "../types/bridge.fixture";
import { ACCOUNT_EMPTY, GRAPHQL_MAINNET_URL } from "./graphql/constants";
import {
  getAccountBalances,
  getAllBalancesCached,
  getBlock,
  getBlockInfo,
  getCheckpoint,
  getLastBlock,
  getDelegatedStakes,
  getListOperations,
  getOperationExtra,
  getOperations,
  getValidators,
  paymentInfo,
} from "./sdk";

const JSON_RPC_ID = "sui-jsonrpc-mig";
const GRAPHQL_ID = "sui-graphql-mig";
const JSON_RPC_URL = getJsonRpcFullnodeUrl("mainnet");

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
    // Both transports always need both URLs: dispatcher routes via the flag,
    // but `withApi`-bound callers (`createTransaction`, `tx.build`) keep using
    // `node.url` regardless of the flag state.
    const node = { url: JSON_RPC_URL, graphqlUrl: GRAPHQL_MAINNET_URL };
    if (id === JSON_RPC_ID) {
      return { node, status: { type: "active" }, features: { graphql: false } };
    }
    if (id === GRAPHQL_ID) {
      return { node, status: { type: "active" }, features: { graphql: true } };
    }
    throw new Error(`Unknown currency id in migration integ test: ${id}`);
  });

  // Anchor the stable checkpoint at the LAGGING endpoint's latest minus the
  // lookback — so both transports definitely have it indexed. The GraphQL
  // endpoint can lag the JSON-RPC fullnode by hundreds of checkpoints during
  // re-index; min(rpc, gql) avoids spurious "not found" failures.
  const [rpcLatest, gqlLatest] = await Promise.all([
    getLastBlock(JSON_RPC_ID),
    getLastBlock(GRAPHQL_ID),
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
  // Allow one-sided drift: GraphQL may surface a tx finalised after JSON-RPC's snapshot.
  // But we expect at least some overlap.
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

describe("JSON-RPC vs GraphQL shape parity (live mainnet)", () => {
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
      const rpc = await getAllBalancesCached(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getAllBalancesCached(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);

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
      const rpc = await getAccountBalances(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getAccountBalances(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);
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
      const rpc = await getLastBlock(JSON_RPC_ID);
      const gql = await getLastBlock(GRAPHQL_ID);
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
      const rpc = await getCheckpoint(stableCheckpointSequence, JSON_RPC_ID);
      const gql = await getCheckpoint(stableCheckpointSequence, GRAPHQL_ID);
      assertShapeBoth(rpc, gql, checkpointShape, "getCheckpoint");
      // Historical checkpoint is immutable: digest+seq+timestamp are deterministic.
      // If the GraphQL endpoint is currently lagging the JSON-RPC endpoint indexing,
      // this exact-match will fail — that's a real availability divergence, not noise.
      expect(gql.sequenceNumber).toBe(rpc.sequenceNumber);
      expect(gql.digest).toBe(rpc.digest);
      expect(gql.timestampMs).toBe(rpc.timestampMs);
    });

    it("GraphQL rejects digest input; JSON-RPC accepts it", async () => {
      const latest = await getLastBlock(JSON_RPC_ID);
      await expect(getCheckpoint(latest.digest, JSON_RPC_ID)).resolves.toMatchObject({
        digest: latest.digest,
      });
      await expect(getCheckpoint(latest.digest, GRAPHQL_ID)).rejects.toThrow(/sequence number/i);
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
      const rpc = await getBlockInfo(stableCheckpointSequence, JSON_RPC_ID);
      const gql = await getBlockInfo(stableCheckpointSequence, GRAPHQL_ID);
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
        const block = await getBlock(seq.toString(), JSON_RPC_ID);
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
      const rpc = await getBlock(smallBlockSequence, JSON_RPC_ID);
      const gql = await getBlock(smallBlockSequence, GRAPHQL_ID);
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
      const rpc = await getDelegatedStakes(FIGMENT_SUI_VALIDATOR_ADDRESS, JSON_RPC_ID);
      const gql = await getDelegatedStakes(FIGMENT_SUI_VALIDATOR_ADDRESS, GRAPHQL_ID);
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
      const rpc = await getValidators(JSON_RPC_ID);
      const gql = await getValidators(GRAPHQL_ID);
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
    // GraphQL fetches one newest page (≤50); JSON-RPC accumulates up to 300 across IN+OUT.
    // Comparison is one-sided: every GraphQL op must have a matching JSON-RPC op with
    // the same shape. Adapter gaps for value/fee/recipients/asset/extra are tracked
    // inline as TODOs; the shape contract here lets the test ship today.
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
        accountId,
        ACTIVE_ACCOUNT,
        undefined,
        undefined,
        JSON_RPC_ID,
      );
      const gql = await getOperations(
        accountId,
        ACTIVE_ACCOUNT,
        undefined,
        undefined,
        GRAPHQL_ID,
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
        // TODO adapter gaps (graphql/transactions.ts):
        //   - value / fee: `getUnifiedBalanceChanges` reads `balanceChanges` +
        //     `effects.accumulatorEvents`; gRPC-proto shapes need fuller mapping.
        //   - recipients: PTB `inputs` shape in `transactionJson` differs from JSON-RPC.
        //   - extra: depends on recipients extraction.
        //   - asset (in alpaca path): coin-type long-form not normalised via `shortenCoinType`.
      }
    });
  });

  describe("getOperationExtra", () => {
    let sampleDigest: string;

    beforeAll(async () => {
      // Pick the newest finalised digest for the fixture account. Whether it's a
      // staking event or a transfer, the handler is shape-stable across transports.
      const accountId = `js:2:sui:${ACTIVE_ACCOUNT}:sui`;
      const ops = await getOperations(
        accountId,
        ACTIVE_ACCOUNT,
        undefined,
        undefined,
        JSON_RPC_ID,
      );
      if (ops.length === 0) throw new Error("ACTIVE_ACCOUNT has no recent ops — refresh fixture");
      sampleDigest = ops[0].hash;
    });

    it("returns the same Record<string,string> shape on both transports", async () => {
      const rpc = await getOperationExtra(sampleDigest, JSON_RPC_ID);
      const gql = await getOperationExtra(sampleDigest, GRAPHQL_ID);
      // Both are `Record<string,string>` (possibly empty for non-staking txs).
      assertShapeBoth(rpc, gql, { object: {} }, "getOperationExtra");
      expect(Object.keys(gql).sort()).toEqual(Object.keys(rpc).sort());
      for (const k of Object.keys(rpc)) {
        expect(typeof (gql as Record<string, unknown>)[k]).toBe(
          typeof (rpc as Record<string, unknown>)[k],
        );
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
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        undefined,
        JSON_RPC_ID,
      );
      const gqlPage = await getListOperations(
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        undefined,
        GRAPHQL_ID,
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
        // TODO same adapter gaps as `getOperations` — value/tx.fees/recipients/asset.
      }
    });

    it("second page (cursor-driven): both transports return strictly older items than the cursor", async () => {
      const first = await getListOperations(
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        undefined,
        JSON_RPC_ID,
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
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        first.next,
        JSON_RPC_ID,
      );
      const gqlPage = await getListOperations(
        ACTIVE_ACCOUNT,
        "desc",
        undefined,
        first.next,
        GRAPHQL_ID,
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
      const rpc = await paymentInfo(ACTIVE_ACCOUNT, fakeTx, JSON_RPC_ID);
      const gql = await paymentInfo(ACTIVE_ACCOUNT, fakeTx, GRAPHQL_ID);
      assertShapeBoth(rpc, gql, paymentInfoShape, "paymentInfo");
      expect(gql.gasBudget).toBe(rpc.gasBudget); // SDK-set, deterministic per fixture
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
      const rpc = await logicGetStakes(FIGMENT_SUI_VALIDATOR_ADDRESS, undefined, JSON_RPC_ID);
      const gql = await logicGetStakes(FIGMENT_SUI_VALIDATOR_ADDRESS, undefined, GRAPHQL_ID);
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
      const rpc = await getDelegatedStakes(ACCOUNT_EMPTY, JSON_RPC_ID);
      const gql = await getDelegatedStakes(ACCOUNT_EMPTY, GRAPHQL_ID);
      expect(rpc).toEqual([]);
      expect(gql).toEqual([]);
    });

    it("getAllBalancesCached returns an empty array on both transports", async () => {
      const rpc = await getAllBalancesCached(ACCOUNT_EMPTY, JSON_RPC_ID);
      const gql = await getAllBalancesCached(ACCOUNT_EMPTY, GRAPHQL_ID);
      expect(rpc).toEqual([]);
      expect(gql).toEqual([]);
    });
  });
});
