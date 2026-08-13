import { getEnv } from "@ledgerhq/live-env";
import type { SuiCoinConfig, SuiTransport } from "../config";
import {
  getAllBalancesCached,
  getBlock,
  getBlockInfo,
  getCheckpoint,
  getDelegatedStakes,
  getLastBlock,
  getListOperations,
  getOperations,
  getStakingExtraByDigest,
  getValidators,
  isSettlementTransaction,
} from "./sdk";
import {
  getBlockGrpc,
  getSystemStateGrpc,
  listTransactionsByAddressGrpc,
  withGrpcApi,
} from "./sdk.grpc";
import { fromSystemStateJson, isU64Numeric, poolRefsFromSystemState } from "./staking";

// Per-arm parity for the gRPC implementations, asserted against GraphQL on live mainnet. This is
// the detailed leg: it reaches individual arms and their reconstructed values, where the
// `*.migration.integ.test.ts` suites assert dispatcher-level shape parity. Shapes and identifiers
// are asserted; amounts drift between calls.
const ACCOUNT = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

/** Config is injected per call (ADR-019), so each assertion names the arm it exercises. */
const configFor = (transport: SuiTransport): SuiCoinConfig => ({
  status: { type: "active" },
  node: {
    url: getEnv("API_SUI_NODE_PROXY"),
    graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
    grpcUrl: getEnv("API_SUI_GRPC_PROXY"),
  },
  features: { transport },
});

const graphqlConfig = configFor("graphql");
const grpcConfig = configFor("grpc");

describe("gRPC vs GraphQL parity (live mainnet)", () => {
  describe("getAllBalancesCached", () => {
    it("returns the same coin types in the same shape across transports", async () => {
      const viaGraphql = await getAllBalancesCached(graphqlConfig, ACCOUNT);

      const viaGrpc = await getAllBalancesCached(grpcConfig, ACCOUNT);

      expect(viaGrpc.length).toBeGreaterThan(0);
      // Coin types are deterministic and must match exactly — this is what catches a missing
      // canonical-to-short normalisation, which would otherwise fail only on `===` downstream.
      expect(new Set(viaGrpc.map(b => b.coinType))).toEqual(
        new Set(viaGraphql.map(b => b.coinType)),
      );
      for (const balance of viaGrpc) {
        expect(balance.totalBalance).toMatch(/^\d+$/);
        expect(balance.fundsInAddressBalance).toMatch(/^\d+$/);
      }
    });

    it("shortens the native coin type rather than echoing the canonical form", async () => {
      const balances = await getAllBalancesCached(grpcConfig, ACCOUNT);

      expect(balances.map(b => b.coinType)).toContain("0x2::sui::SUI");
    });
  });

  describe("getLastBlock", () => {
    // Deliberately not compared against GraphQL's tip: the two are served by different
    // backends whose lag differs, so a cross-transport height comparison is racy. Recency
    // against wall-clock is the transport-independent invariant — it still catches a stale
    // or wrong-chain endpoint.
    it("returns a well-formed, recent tip", async () => {
      const tip = await getLastBlock(grpcConfig);

      expect(tip.digest).toEqual(expect.any(String));
      expect(tip.sequenceNumber).toMatch(/^\d+$/);
      expect(tip.timestampMs).toMatch(/^\d+$/);
      expect(Date.now() - Number(tip.timestampMs)).toBeLessThan(60 * 60 * 1000);
    });

    it("matches the GraphQL shape", async () => {
      const viaGraphql = await getLastBlock(graphqlConfig);

      const viaGrpc = await getLastBlock(grpcConfig);

      expect(Object.keys(viaGrpc).sort()).toEqual(Object.keys(viaGraphql).sort());
    });
  });

  describe("getCheckpoint", () => {
    // A fixed historical checkpoint: both transports must agree exactly.
    const SEQUENCE = "300000000";

    it("agrees with GraphQL on a historical checkpoint", async () => {
      const viaGraphql = await getCheckpoint(graphqlConfig, SEQUENCE);

      const viaGrpc = await getCheckpoint(grpcConfig, SEQUENCE);

      expect(viaGrpc).toEqual(viaGraphql);
    });

    // GraphQL rejects digest lookups outright, which is why getBlockInfo/getBlock fall back to
    // JSON-RPC for them. gRPC accepts either, so that fallback is not needed after cutover.
    it("resolves a checkpoint by digest, which GraphQL cannot", async () => {
      const bySequence = await getCheckpoint(grpcConfig, SEQUENCE);

      const byDigest = await getCheckpoint(grpcConfig, bySequence.digest);

      expect(byDigest).toEqual(bySequence);

      await expect(getCheckpoint(graphqlConfig, bySequence.digest)).rejects.toThrow(
        /digest-based lookups are not supported/,
      );
    });
  });

  describe("getStakingExtraByDigest", () => {
    // Same live transactions the JSON-RPC suite pins (sdk.integ.test.ts).
    const DELEGATE_TX_DIGEST = "EkJbwk9R2pmJhxfAVpRqbfDYQN1yiNap1qMPVrKedwZf";
    const UNDELEGATE_TX_DIGEST = "4UtCqCH3oNEdaprZR9UjaMGg6HgLn3V3q3FEcvs5vieM";

    // The SDK warns that Core's `Event.json` field names can vary by transport. The staking
    // extractor reads `validator_address` and `amount`/`principal_amount`, so this asserts the
    // gRPC rendering actually matches — a rename would silently yield null extras.
    it.each([
      ["DELEGATE", DELEGATE_TX_DIGEST],
      ["UNDELEGATE", UNDELEGATE_TX_DIGEST],
    ] as const)("extracts %s extras identically to GraphQL", async (type, digest) => {
      const viaGraphql = await getStakingExtraByDigest(graphqlConfig, digest, type);

      const viaGrpc = await getStakingExtraByDigest(grpcConfig, digest, type);

      expect(viaGrpc).not.toBeNull();
      expect(viaGrpc).toEqual(viaGraphql);
    });
  });

  describe("getBlock", () => {
    // Checkpoint 300,000,000 is immutable, so these counts are stable. It contains 8
    // transactions: 3 ConsensusCommitPrologue (system) and 5 programmable, of which 3 are
    // SIP-58 settlement transactions.
    const SEQUENCE = "300000000";

    it("resolves every transaction kind and detects settlement transactions", async () => {
      const block = await withGrpcApi(grpcConfig, api => getBlockGrpc(api, SEQUENCE));

      expect(block.transactions).toHaveLength(8);
      // Every kind resolves to a string — system transactions included. The adapter must not
      // throw on them: `parseGrpcTransactionResponse` rejects non-programmable bodies, and every
      // checkpoint contains at least one.
      const kinds = block.transactions.map(
        tx => (tx.transaction?.data?.transaction as { kind?: unknown })?.kind,
      );
      expect(kinds.every(kind => typeof kind === "string")).toBe(true);
      expect(kinds.filter(kind => kind === "ConsensusCommitPrologue")).toHaveLength(3);
      expect(block.transactions.filter(isSettlementTransaction)).toHaveLength(3);
    });

    it("returns a subset of the GraphQL block, excluding settlement transactions", async () => {
      const viaGraphql = await getBlock(graphqlConfig, SEQUENCE);

      const viaGrpc = await getBlock(grpcConfig, SEQUENCE);

      expect(viaGrpc.info).toEqual(viaGraphql.info);

      // Not an equality assertion: the GraphQL arm leaves `transaction.data.transaction.kind` as
      // an object for 6 of the 8 transactions, so `isSettlementTransaction` never matches and it
      // returns all 8. gRPC reads the proto oneof directly, classifies all 8, and correctly drops
      // the 3 settlement transactions. gRPC is the more faithful of the two here; asserting
      // equality would encode the GraphQL defect.
      const grpcHashes = viaGrpc.transactions.map(tx => tx.hash);
      const graphqlHashes = viaGraphql.transactions.map(tx => tx.hash);
      expect(grpcHashes.length).toBeLessThan(graphqlHashes.length);
      expect(graphqlHashes).toEqual(expect.arrayContaining(grpcHashes));
    });
  });

  describe("getSystemStateGrpc", () => {
    // Locks the contract the whole staking migration rests on: the three-call chain lands on Move
    // JSON that the lifted, transport-neutral helpers accept without adaptation.
    it("returns a system state the shared staking helpers accept", async () => {
      const state = await withGrpcApi(grpcConfig, getSystemStateGrpc);

      expect(Number(state.epoch)).toBeGreaterThan(0);
      expect(state.validators.active_validators.length).toBeGreaterThan(50);

      // Every active validator must expose the pool refs the reward/APY maths reads.
      const refs = poolRefsFromSystemState(state);
      expect(refs.size).toBe(state.validators.active_validators.length);
      for (const ref of refs.values()) {
        expect(ref.exchangeRatesId).toMatch(/^0x[0-9a-f]{64}$/);
        expect(isU64Numeric(ref.currentRate.sui_amount)).toBe(true);
      }
    });

    it("maps validators onto the shared summary shape", async () => {
      const state = await withGrpcApi(grpcConfig, getSystemStateGrpc);

      const { activeValidators, poolToValidator } = fromSystemStateJson(state);
      expect(activeValidators.length).toBe(state.validators.active_validators.length);
      expect(poolToValidator.size).toBe(activeValidators.length);
      for (const validator of activeValidators.slice(0, 5)) {
        expect(validator.suiAddress).toMatch(/^0x[0-9a-f]{64}$/);
        expect(validator.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getValidators", () => {
    it("agrees with GraphQL on the validator set and computes comparable APY", async () => {
      const viaGraphql = await getValidators(graphqlConfig);

      const viaGrpc = await getValidators(grpcConfig);

      // The active set is deterministic within an epoch, so addresses must match exactly.
      expect(new Set(viaGrpc.map(v => v.suiAddress))).toEqual(
        new Set(viaGraphql.map(v => v.suiAddress)),
      );

      const graphqlApy = new Map(viaGraphql.map(v => [v.suiAddress, v.apy]));
      const withApy = viaGrpc.filter(v => v.apy > 0);
      // Both arms compute APY from the same rates via the same formula, so a real discrepancy means
      // the rate fetch diverged. A wide tolerance still catches that: mainnet APY sits near 2-3%,
      // so a decoding error would land orders of magnitude out, not fractions of a percent.
      expect(withApy.length).toBeGreaterThan(viaGrpc.length / 2);
      for (const validator of withApy) {
        expect(validator.apy).toBeLessThan(1);
        const reference = graphqlApy.get(validator.suiAddress) ?? 0;
        if (reference > 0) expect(Math.abs(validator.apy - reference)).toBeLessThan(0.01);
      }
    });
  });

  describe("getDelegatedStakes", () => {
    // Live delegator: the sender of the DELEGATE transaction the JSON-RPC suite pins.
    const DELEGATOR = "0x13d73cab19d2cf14e39289b122ed93fb0f9edd00e4c829e0cefb1f0611c54a8f";

    // Stake ids and principals are immutable, so they must match exactly; estimatedReward moves
    // with the epoch's rates, so only its presence is asserted.
    it("reconstructs the same stakes as GraphQL", async () => {
      const viaGraphql = await getDelegatedStakes(graphqlConfig, DELEGATOR);

      const viaGrpc = await getDelegatedStakes(grpcConfig, DELEGATOR);

      expect(viaGrpc.length).toBeGreaterThan(0);
      expect(viaGrpc.map(s => s.stakingPool).sort()).toEqual(
        viaGraphql.map(s => s.stakingPool).sort(),
      );
      expect(viaGrpc.map(s => s.validatorAddress).sort()).toEqual(
        viaGraphql.map(s => s.validatorAddress).sort(),
      );

      const flatten = (stakes: typeof viaGrpc) =>
        stakes
          .flatMap(group => group.stakes.map(s => `${s.stakedSuiId}:${s.principal}:${s.status}`))
          .sort();
      expect(flatten(viaGrpc)).toEqual(flatten(viaGraphql));
    });

    it("populates estimatedReward for active stakes", async () => {
      const stakes = await getDelegatedStakes(grpcConfig, DELEGATOR);

      const active = stakes.flatMap(g => g.stakes).filter(s => s.status === "Active");
      expect(active.length).toBeGreaterThan(0);
      for (const stake of active) {
        // A non-"0" reward proves the activation-epoch rate resolved and the pool-token maths ran;
        // "0" is the documented degradation when a rate is missing, so it must not be the only case.
        expect(stake).toHaveProperty("estimatedReward");
        expect(String((stake as { estimatedReward: string }).estimatedReward)).toMatch(/^\d+$/);
      }
      expect(active.some(s => (s as { estimatedReward?: string }).estimatedReward !== "0")).toBe(
        true,
      );
    });
  });

  describe("operations history", () => {
    // Last on-chain activity 2026-05-07, well past QuickNode's 90-day GraphQL retention. Their
    // gRPC archive index was capped at ~14 epochs until 2026-08-10; this address is the
    // reproduction that got it fixed, so it doubles as the regression guard.
    const STALE_ACCOUNT = "0x19afe206a5d6b85e6d4346abc479e56a036372c93f0e994ad02e9a5e48d94a99";
    const OLDEST_CHECKPOINT = 38176423;

    it("reaches history far older than the GraphQL retention window", async () => {
      const { transactions } = await withGrpcApi(grpcConfig, api =>
        listTransactionsByAddressGrpc(api, {
          address: STALE_ACCOUNT,
          limit: 3,
          order: "asc",
        }),
      );

      expect(transactions.length).toBeGreaterThan(0);
      // 2024-07-01 — corroborated independently by Sui's public GraphQL endpoint. If the archive
      // index is ever narrowed again, this is the assertion that catches it.
      expect(Number(transactions[0].checkpoint)).toBe(OLDEST_CHECKPOINT);
    });

    it("paginates across the archive boundary without gaps or repeats", async () => {
      const seen = new Set<string>();
      let cursor: number | undefined;
      let pages = 0;

      while (pages < 12) {
        const { transactions } = await withGrpcApi(grpcConfig, api =>
          listTransactionsByAddressGrpc(api, {
            address: STALE_ACCOUNT,
            limit: 5,
            order: "asc",
            ...(cursor !== undefined && { startCheckpoint: cursor }),
          }),
        );
        if (transactions.length === 0) break;
        for (const tx of transactions) expect(seen.has(tx.digest)).toBe(false);
        for (const tx of transactions) seen.add(tx.digest);
        const lastCheckpoint = Number(transactions.at(-1)?.checkpoint);
        if (!Number.isFinite(lastCheckpoint)) break;
        cursor = lastCheckpoint + 1;
        pages++;
      }

      // ~46 transactions spanning 2024-07 to 2026-05; the exact count grows if the address is used
      // again, so assert the span rather than a total.
      expect(seen.size).toBeGreaterThan(20);
      expect(pages).toBeGreaterThan(1);
    });

    // The user-visible symptom this migration exists to fix, reproduced on one address. `ACCOUNT` —
    // the fixture the JSON-RPC suite has always used — last transacted around 2026-05-08, so its
    // whole history has aged out of the 90-day GraphQL retention window. gRPC's archive index still
    // has it, so an account that looks empty on GraphQL shows its operations again.
    it("recovers history that GraphQL has dropped", async () => {
      const viaGraphql = await getOperations(
        graphqlConfig,
        "js:2:sui:x:",
        ACCOUNT,
        undefined,
        "desc",
      );

      const viaGrpc = await getOperations(grpcConfig, "js:2:sui:x:", ACCOUNT, undefined, "desc");

      expect(viaGraphql).toHaveLength(0);
      expect(viaGrpc.length).toBeGreaterThan(0);
    });

    it("builds well-formed operations attributed to the account", async () => {
      const operations = await getOperations(grpcConfig, "js:2:sui:x:", ACCOUNT, undefined, "desc");

      expect(operations.length).toBeGreaterThan(0);
      for (const operation of operations) {
        expect(operation.hash).toEqual(expect.any(String));
        expect(operation.blockHeight).toBeGreaterThan(0);
        expect(operation.date.getTime()).toBeGreaterThan(0);
        // Every operation must involve the queried account on one side; otherwise the
        // affected-address filter or the sender/recipient mapping has gone wrong.
        expect([...operation.senders, ...operation.recipients]).toContain(ACCOUNT);
      }
      // Newest-first, matching the JSON-RPC and GraphQL arms.
      const dates = operations.map(operation => operation.date.getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });
  });

  describe("getBlockInfo", () => {
    it("agrees with GraphQL on a historical checkpoint", async () => {
      const viaGraphql = await getBlockInfo(graphqlConfig, "300000000");

      const viaGrpc = await getBlockInfo(grpcConfig, "300000000");

      expect(viaGrpc).toEqual(viaGraphql);
    });
  });

  // The `ListCheckpoints` request that resolves these digests is otherwise only asserted against a
  // stub. A wrong read-mask path or range bound degrades silently to `synthetic-<sequence>`, which a
  // shape-only assertion accepts, so each digest is checked against the checkpoint it names.
  //
  // GraphQL is not the comparator here: this account's history sits outside its retention window —
  // "recovers history that GraphQL has dropped" asserts GraphQL returns nothing for it.
  describe("listOperations block hashes", () => {
    it("carries the real checkpoint digest at both ends of the page", async () => {
      const page = await getListOperations(grpcConfig, ACCOUNT, "desc", undefined, undefined);
      expect(page.items.length).toBeGreaterThan(0);

      for (const op of page.items) {
        expect(op.tx.block.hash).not.toMatch(/^synthetic-/);
      }

      // Both ends, because the page's lowest and highest checkpoints are exactly the
      // `ListCheckpoints` range bounds — an off-by-one there loses only the edge digests.
      const edges = [page.items[0], page.items[page.items.length - 1]];
      const named = await Promise.all(
        edges.map(op => getBlockInfo(grpcConfig, String(op.tx.block.height))),
      );
      expect(edges.map(op => op.tx.block.hash)).toEqual(named.map(checkpoint => checkpoint.hash));
    });
  });
});
