import { createSuiGraphQLClient } from "./graphql/client";
import type { SuiCoinConfig } from "../config";

const config = {
  node: {
    url: "https://mockapi.sui.io",
    graphqlUrl: "https://mockapi.sui.io/graphql",
    grpcUrl: "https://mockapi.sui.io",
  },
  status: { type: "active" },
  features: { transport: "graphql" },
} as unknown as SuiCoinConfig;
import { mist } from "../constants";
import { RATE_BATCH_CHUNK_SIZE, STAKES_PAGE_SIZE } from "./graphql/constants";
import { UNKNOWN_VALIDATOR, APY_LOOKBACK_EPOCHS } from "./staking";
import {
  executeTransactionBlock,
  getAllBalancesCached,
  getCheckpoint,
  getLastBlock,
  getDelegatedStakes,
  getListOperations,
  getOperations,
  getStakingExtraByDigest,
  getValidators,
} from "./sdk";
import {
  executeTransactionGraphQL,
  getBlockGraphQL,
  getBlockInfoFieldsGraphQL,
  getTransactionsWithCheckpointDigestsGraphQL,
  graphqlFetcher,
  resolveCheckpointSequenceForDigestGraphQL,
  simulateTransactionGraphQL,
} from "./sdk.graphql";
import type { SuiGraphQLClient } from "./graphql/client";
import { isFinalizedTxNode } from "./graphql/transactions";
import {
  addr,
  batchExchangeRateCalls,
  bindMockNextGraphQLClient,
  expectActive,
  fakeBalance,
  fakeBalancesPage,
  fakeSingleRate,
  fakeStakeNode,
  fakeStakesPage,
  fakeSystemStateQuery,
  fakeUniformBatchRates,
  fakeUniformSingleRate,
  singleRateCalls,
  singleRateVars,
  stakeQueryCalls,
} from "./sdk.graphql.fixtures";

// JSON-RPC stays mocked — any caller leaking onto it fails loudly via this proxy.
const unexpectedJsonRpc = jest.fn(() => {
  throw new Error("JSON-RPC client invoked on GraphQL test path");
});

jest.mock("./graphql/client", () => ({
  createSuiGraphQLClient: jest.fn(),
}));

jest.mock("@mysten/sui/jsonRpc", () => ({
  ...jest.requireActual("@mysten/sui/jsonRpc"),
  SuiJsonRpcClient: jest.fn().mockImplementation(
    () =>
      new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (typeof prop === "symbol" || prop === "then") return undefined;
            return unexpectedJsonRpc;
          },
        },
      ),
  ),
  getJsonRpcFullnodeUrl: jest.fn().mockReturnValue("https://mockapi.sui.io"),
}));

const factoryMock = createSuiGraphQLClient as unknown as jest.Mock;
const mockNext = bindMockNextGraphQLClient(factoryMock);

beforeEach(() => {
  factoryMock.mockReset();
  unexpectedJsonRpc.mockClear();
});

describe("getAllBalancesCached on GraphQL transport", () => {
  it("should remap addressBalance to fundsInAddressBalance", async () => {
    // GIVEN
    const query = jest
      .fn()
      .mockResolvedValueOnce(
        fakeBalancesPage([
          fakeBalance("0x2::sui::SUI", mist(1), mist(0.4)),
          fakeBalance("0x9::usdc::USDC", "500000"),
        ]),
      );
    mockNext({ query });
    const owner = addr("11");

    // WHEN
    const result = await getAllBalancesCached(config, owner);

    // THEN — cache stores only the narrow DispatchedCoinBalance shape; the
    // GraphQL transport's neutral fillers for JSON-RPC-only fields are stripped.
    expect(result).toEqual([
      {
        coinType: "0x2::sui::SUI",
        totalBalance: mist(1),
        fundsInAddressBalance: mist(0.4),
      },
      {
        coinType: "0x9::usdc::USDC",
        totalBalance: "500000",
        fundsInAddressBalance: "0",
      },
    ]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0].variables).toEqual({ owner, cursor: null });
  });

  it("should paginate until hasNextPage is false", async () => {
    // GIVEN
    const query = jest
      .fn()
      .mockResolvedValueOnce(
        fakeBalancesPage([fakeBalance("0xA::a::A", "1")], {
          hasNextPage: true,
          endCursor: "cursor1",
        }),
      )
      .mockResolvedValueOnce(fakeBalancesPage([fakeBalance("0xB::b::B", "2")]));
    mockNext({ query });
    const owner = addr("22");

    // WHEN
    const result = await getAllBalancesCached(config, owner);

    // THEN
    expect(result).toHaveLength(2);
    expect(result.map(b => b.coinType)).toEqual(["0xA::a::A", "0xB::b::B"]);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0].variables).toEqual({ owner, cursor: null });
    expect(query.mock.calls[1][0].variables).toEqual({ owner, cursor: "cursor1" });
  });

  describe("cursor-expiry retry", () => {
    it("should restart pagination from page 1 when a next-page query throws cursor-expired", async () => {
      // GIVEN
      const owner = addr("aa");
      const expired = new Error("Pagination cursor outside the available range");
      const query = jest
        .fn()
        // 1. initial: 1 balance, hasNextPage: true
        .mockResolvedValueOnce(
          fakeBalancesPage([fakeBalance("0x2::sui::SUI", "100")], {
            hasNextPage: true,
            endCursor: "stale",
          }),
        )
        // 2. next page (cursor: "stale") → throws cursor-expired
        .mockRejectedValueOnce(expired)
        // 3. retry: fresh page 1, hasNextPage: false
        .mockResolvedValueOnce(fakeBalancesPage([fakeBalance("0x2::sui::SUI", "200")]));
      mockNext({ query });

      // WHEN
      const result = await getAllBalancesCached(config, owner);

      // THEN
      // Pre-retry balance is discarded; only post-retry survives.
      // Cache stores the narrow DispatchedCoinBalance shape.
      expect(result).toEqual([
        {
          coinType: "0x2::sui::SUI",
          totalBalance: "200",
          fundsInAddressBalance: "0",
        },
      ]);
      expect(query).toHaveBeenCalledTimes(3);
      expect(query.mock.calls[0][0].variables).toEqual({ owner, cursor: null });
      expect(query.mock.calls[1][0].variables).toEqual({ owner, cursor: "stale" });
      expect(query.mock.calls[2][0].variables).toEqual({ owner, cursor: null });
    });
  });
});

describe("getLastBlock on GraphQL transport", () => {
  it("should resolve digest and timestamp from the latest checkpoint", async () => {
    // GIVEN
    const isoTimestamp = "2026-04-01T12:34:56.789Z";
    // LATEST_CHECKPOINT_SEQUENCE carries all three fields; the server returns UInt53 as a number.
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: { digest: "AbCdEfDigestZ", sequenceNumber: 12345, timestamp: isoTimestamp },
      },
    });
    mockNext({ query });

    // WHEN
    const result = await getLastBlock(config);

    // THEN
    expect(result).toEqual({
      digest: "AbCdEfDigestZ",
      // Returned shape converts UInt53 back to a string for downstream
      // JSON-RPC compatibility.
      sequenceNumber: "12345",
      timestampMs: String(new Date(isoTimestamp).getTime()),
    });
    // One round trip: a second query racing the tip is what produced intermittent
    // "CheckpointBySequence failed: not found" against live mainnet.
    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe("getCheckpoint on GraphQL transport", () => {
  it("should return digest, sequence and timestamp for a valid sequence number", async () => {
    // GIVEN
    const isoTimestamp = "2026-05-01T00:00:00.000Z";
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "DigestForSeq99",
          // Server returns UInt53 as a JSON number.
          sequenceNumber: 99,
          timestamp: isoTimestamp,
        },
      },
    });
    mockNext({ query });

    // WHEN
    const result = await getCheckpoint(config, "99");

    // THEN
    expect(result.digest).toBe("DigestForSeq99");
    expect(result.sequenceNumber).toBe("99");
    expect(result.timestampMs).toBe(String(new Date(isoTimestamp).getTime()));
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0].variables).toEqual({ sequenceNumber: 99 });
  });

  it("should reject digest input with a clear error", async () => {
    // 32-byte digest, base58-ish — anything non-numeric.
    const digest = "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt";
    await expect(getCheckpoint(config, digest)).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    // Guard runs before withGraphQLApi — no client should be constructed.
    expect(factoryMock).not.toHaveBeenCalled();
  });

  it("should reject numeric input above MAX_SAFE_INTEGER (would lose precision)", async () => {
    // 16-digit number > 2^53-1: routing it through `Number(id)` silently rounds
    // and would query the wrong checkpoint. UInt53 schema rejects unsafe values.
    const unsafe = "9999999999999999";
    await expect(getCheckpoint(config, unsafe)).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    expect(factoryMock).not.toHaveBeenCalled();
  });

  it("should propagate the server's error message", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "Checkpoint out of available range" }],
    });
    mockNext({ query });

    await expect(getCheckpoint(config, "9999999")).rejects.toThrow(
      /Checkpoint out of available range/,
    );
  });
});

describe("getDelegatedStakes on GraphQL transport", () => {
  /** Pending-status stake — used by tests that don't care about reward math. */
  const pendingStake = (id: string, pool_id = "0xp") =>
    fakeStakeNode({ id, pool_id, stake_activation_epoch: "200", principal: "1" });

  it("should group stakes by pool, join validator addresses, and label status", async () => {
    // GIVEN
    const owner = addr("33");
    const POOL_A = "0xpoolA";
    const POOL_B = "0xpoolB";
    const VAL_A = "0xvalidatorA";
    const VAL_B = "0xvalidatorB";
    const query = jest
      .fn()
      .mockResolvedValueOnce(
        fakeSystemStateQuery("100", [
          { poolId: POOL_A, validatorAddress: VAL_A },
          { poolId: POOL_B, validatorAddress: VAL_B },
        ]),
      )
      .mockResolvedValueOnce(
        fakeStakesPage([
          fakeStakeNode({
            id: "0xstk1",
            pool_id: POOL_A,
            stake_activation_epoch: "50", // < 100 → Active
            principal: mist(1),
          }),
          fakeStakeNode({
            id: "0xstk2",
            pool_id: POOL_A,
            stake_activation_epoch: "60", // < 100 → Active, same pool
            principal: mist(2),
          }),
          fakeStakeNode({
            id: "0xstk3",
            pool_id: POOL_B,
            stake_activation_epoch: "200", // > 100 → Pending
            principal: mist(0.5),
          }),
        ]),
      );
    mockNext({ query });

    // WHEN
    const result = await getDelegatedStakes(config, owner);

    // THEN
    expect(result).toHaveLength(2);

    const poolA = result.find(d => d.stakingPool === POOL_A)!;
    const poolB = result.find(d => d.stakingPool === POOL_B)!;
    expect(poolA.validatorAddress).toBe(VAL_A);
    expect(poolB.validatorAddress).toBe(VAL_B);
    expect(poolA.stakes).toHaveLength(2);
    expect(poolB.stakes).toHaveLength(1);

    const stk1 = poolA.stakes.find(s => s.stakedSuiId === "0xstk1")!;
    expectActive(stk1);
    expect(stk1.principal).toBe(mist(1));
    expect(stk1.stakeActiveEpoch).toBe("50");
    expect(stk1.stakeRequestEpoch).toBe("49"); // active − 1
    // No exchange rate mocked → reward lookup degrades to "0".
    expect(stk1.estimatedReward).toBe("0");

    const stk3 = poolB.stakes[0];
    expect(stk3.status).toBe("Pending");
    expect(stk3.principal).toBe(mist(0.5));
  });

  it("should paginate stake listings using the cursor", async () => {
    // GIVEN
    const owner = addr("44");
    const POOL = "0xpoolSingle";
    const stake = (id: string, principal: string) =>
      fakeStakeNode({ id, pool_id: POOL, stake_activation_epoch: "5", principal });
    const query = jest
      .fn()
      .mockResolvedValueOnce(fakeSystemStateQuery("10", [{ poolId: POOL }]))
      .mockResolvedValueOnce(
        fakeStakesPage([stake("0xa", "1")], { hasNextPage: true, endCursor: "p1" }),
      )
      .mockResolvedValueOnce(fakeStakesPage([stake("0xb", "2")]));
    mockNext({ query });

    // WHEN
    const result = await getDelegatedStakes(config, owner);

    // THEN
    expect(result).toHaveLength(1);
    expect(result[0].stakes).toHaveLength(2);
    // Second StakedSui page request should pass `after: "p1"`.
    const calls = stakeQueryCalls(query);
    expect(calls[1][0].variables).toEqual({ owner, first: STAKES_PAGE_SIZE, after: "p1" });
  });

  it("should fall back to '<unknown>' validatorAddress for an orphan pool", async () => {
    // GIVEN
    const owner = addr("55");
    const KNOWN_POOL = "0xpoolKnown";
    const ORPHAN_POOL = "0xpoolOrphan";
    const query = jest
      .fn()
      .mockResolvedValueOnce(
        fakeSystemStateQuery("100", [{ poolId: KNOWN_POOL, validatorAddress: "0xknown" }]),
      )
      .mockResolvedValueOnce(
        fakeStakesPage([
          fakeStakeNode({
            id: "0xstkOrphan",
            pool_id: ORPHAN_POOL,
            stake_activation_epoch: "50", // < 100 → Active
            principal: "1000",
          }),
        ]),
      );
    mockNext({ query });

    // WHEN
    const result = await getDelegatedStakes(config, owner);

    // THEN
    expect(result).toHaveLength(1);
    expect(result[0].validatorAddress).toBe(UNKNOWN_VALIDATOR);
    expect(result[0].stakingPool).toBe(ORPHAN_POOL);
    // Active stake in an orphan pool: no rate lookup is planned (no PoolRefs),
    // so reward degrades to "0" rather than failing the call.
    const stk = result[0].stakes[0];
    expectActive(stk);
    expect(stk.estimatedReward).toBe("0");
    expect(singleRateCalls(query)).toHaveLength(0);
    expect(batchExchangeRateCalls(query)).toHaveLength(0);
  });

  it("should send the canonical 32-byte owner across initial and paginated queries", async () => {
    // GIVEN
    const query = jest
      .fn()
      .mockResolvedValueOnce(fakeSystemStateQuery("100", [{ poolId: "0xp" }]))
      .mockResolvedValueOnce(
        fakeStakesPage([pendingStake("0xa")], { hasNextPage: true, endCursor: "c1" }),
      )
      .mockResolvedValueOnce(fakeStakesPage([pendingStake("0xb")]));
    mockNext({ query });

    // WHEN
    await getDelegatedStakes(config, "0x42");

    // THEN
    const expected = "0x" + "0".repeat(62) + "42";
    const calls = stakeQueryCalls(query);
    expect(calls).toHaveLength(2);
    expect(calls[0][0].variables.owner).toBe(expected);
    expect(calls[1][0].variables.owner).toBe(expected);
  });

  describe("reward computation", () => {
    it("should compute estimatedReward from the activation-epoch exchange rate", async () => {
      // GIVEN
      // Pool ratio 1.1 vs activation ratio 1.0 → 100 principal grows to 110 → reward 10.
      const owner = addr("66");
      const POOL = "0xpoolReward";
      const query = jest
        .fn()
        .mockResolvedValueOnce(
          fakeSystemStateQuery("100", [
            {
              poolId: POOL,
              suiBalance: 1_100_000,
              poolTokenBalance: 1_000_000,
              exchangeRatesId: "0xratesReward",
            },
          ]),
        )
        .mockResolvedValueOnce(
          fakeStakesPage([
            fakeStakeNode({
              id: "0xstk",
              pool_id: POOL,
              stake_activation_epoch: "50",
              principal: "100",
            }),
          ]),
        )
        // Single-query rate fetch for activation epoch 50 — ratio 1.0.
        // Tail chunks (size 1 < RATE_BATCH_CHUNK_SIZE) skip BATCH_RATES_15.
        .mockResolvedValueOnce(fakeUniformSingleRate());
      mockNext({ query });

      // WHEN
      const result = await getDelegatedStakes(config, owner);

      // THEN
      expect(result).toHaveLength(1);
      const stk = result[0].stakes[0];
      expectActive(stk);
      expect(stk.estimatedReward).toBe("10");

      // Exactly one EXCHANGE_RATE_AT_EPOCH call, no batch.
      expect(singleRateVars(query)).toEqual([{ table: "0xratesReward", literal: "50u64" }]);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    it("should deduplicate rate lookups for stakes sharing (pool, activation_epoch)", async () => {
      // GIVEN
      // Three stakes — A and B share (pool, epoch=50), C is different epoch.
      const owner = addr("77");
      const POOL = "0xpoolDedup";
      const query = jest
        .fn()
        .mockResolvedValueOnce(
          fakeSystemStateQuery("100", [{ poolId: POOL, exchangeRatesId: "0xratesDedup" }]),
        )
        .mockResolvedValueOnce(
          fakeStakesPage([
            fakeStakeNode({
              id: "0xa",
              pool_id: POOL,
              stake_activation_epoch: "50",
              principal: "100",
            }),
            fakeStakeNode({
              id: "0xb",
              pool_id: POOL,
              stake_activation_epoch: "50",
              principal: "200",
            }),
            fakeStakeNode({
              id: "0xc",
              pool_id: POOL,
              stake_activation_epoch: "60",
              principal: "300",
            }),
          ]),
        )
        // 2 single-query rate fetches (deduped tail chunk < RATE_BATCH_CHUNK_SIZE).
        .mockResolvedValueOnce(fakeUniformSingleRate())
        .mockResolvedValueOnce(fakeUniformSingleRate());
      mockNext({ query });

      // WHEN
      await getDelegatedStakes(config, owner);

      // THEN
      const vars = singleRateVars(query);
      expect(vars).toHaveLength(2);
      expect(new Set(vars.map(v => v.literal))).toEqual(new Set(["50u64", "60u64"]));
      expect(vars.every(v => v.table === "0xratesDedup")).toBe(true);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    it("should not trigger rate lookups for Pending stakes", async () => {
      // GIVEN
      const owner = addr("88");
      const POOL = "0xpoolPending";
      const query = jest
        .fn()
        .mockResolvedValueOnce(fakeSystemStateQuery("100", [{ poolId: POOL }]))
        .mockResolvedValueOnce(fakeStakesPage([pendingStake("0xpending", POOL)]));
      mockNext({ query });

      // WHEN
      const result = await getDelegatedStakes(config, owner);

      // THEN
      expect(result[0].stakes[0].status).toBe("Pending");

      // No rate calls (single or batched) — Pending stakes have no reward.
      expect(singleRateCalls(query)).toHaveLength(0);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });
  });

  describe("cursor-expiry retry", () => {
    it("should restart pagination from page 1 when a cursor is rejected", async () => {
      // GIVEN
      const owner = addr("88");
      const POOL = "0xpoolExp";
      const query = jest
        .fn()
        .mockResolvedValueOnce(fakeSystemStateQuery("100", [{ poolId: POOL }]))
        .mockResolvedValueOnce(
          fakeStakesPage([pendingStake("0xs1", POOL), pendingStake("0xs2", POOL)], {
            hasNextPage: true,
            endCursor: "stale-cursor",
          }),
        )
        // Server rejects the cursor as outside retention window.
        .mockResolvedValueOnce({
          errors: [{ message: "Pagination cursor outside the available range" }],
        })
        // Refetch from null — fresh page, post-rotation.
        .mockResolvedValueOnce(
          fakeStakesPage([pendingStake("0xfresh1", POOL), pendingStake("0xfresh2", POOL)]),
        );
      mockNext({ query });

      // WHEN
      const result = await getDelegatedStakes(config, owner);

      // THEN
      // Pre-retry items must be discarded — only post-retry stakes survive.
      expect(result).toHaveLength(1);
      const ids = result[0].stakes.map(s => s.stakedSuiId).sort();
      expect(ids).toEqual(["0xfresh1", "0xfresh2"]);

      // 4-call dance happened in order; 4th call uses `after: null`.
      const calls = stakeQueryCalls(query);
      expect(calls).toHaveLength(3);
      expect(calls[0][0].variables.after).toBeNull();
      expect(calls[1][0].variables.after).toBe("stale-cursor");
      expect(calls[2][0].variables.after).toBeNull();
    });

    it("should propagate the error when a second cursor-expiry occurs", async () => {
      // GIVEN
      const owner = addr("99");
      const POOL = "0xpoolExp2";
      const initialPage = fakeStakesPage([pendingStake("0xa", POOL)], {
        hasNextPage: true,
        endCursor: "c1",
      });
      const expired = { errors: [{ message: "outside available range" }] };
      const query = jest
        .fn()
        .mockResolvedValueOnce(fakeSystemStateQuery("100", [{ poolId: POOL }]))
        .mockResolvedValueOnce(initialPage) // initial page 1
        .mockResolvedValueOnce(expired) // first next → expired
        .mockResolvedValueOnce(initialPage) // retry: fresh page 1
        .mockResolvedValueOnce(expired); // …next page also expired → must propagate
      mockNext({ query });

      // WHEN / THEN
      await expect(getDelegatedStakes(config, owner)).rejects.toThrow(/outside available range/);
    });
  });
});

describe("getValidators on GraphQL transport", () => {
  it("should propagate errors[] from SUI_SYSTEM_STATE without attempting any rate fetches", async () => {
    // GIVEN
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "system state unavailable" }, { message: "epoch boundary" }],
    });
    mockNext({ query });

    // WHEN / THEN
    await expect(getValidators(config)).rejects.toThrow(/system state unavailable; epoch boundary/);
    expect(query).toHaveBeenCalledTimes(1);
    expect(singleRateCalls(query)).toHaveLength(0);
    expect(batchExchangeRateCalls(query)).toHaveLength(0);
  });

  it("should map active_validators to SuiValidatorSummary[] and fall back to apy=0 on rate-fetch failure", async () => {
    // GIVEN
    const query = jest
      .fn()
      .mockResolvedValueOnce(
        fakeSystemStateQuery("42", [
          { poolId: "0xp1", validatorAddress: "0xv1", name: "V1" },
          { poolId: "0xp2", validatorAddress: "0xv2", name: "V2" },
        ]),
      )
      // Rate lookups return nulls → fetchExchangeRate returns null → APY = 0.
      .mockResolvedValueOnce({ data: { address: { dynamicField: null } } })
      .mockResolvedValueOnce({ data: { address: { dynamicField: null } } });
    mockNext({ query });

    // WHEN
    const result = await getValidators(config);

    // THEN
    expect(result).toHaveLength(2);
    const v1 = result.find(v => v.suiAddress === "0xv1")!;
    expect(v1.name).toBe("V1");
    expect(v1.description).toBe("desc");
    expect(v1.imageUrl).toBe("https://logo");
    expect(v1.projectUrl).toBe("https://project");
    expect(v1.commissionRate).toBe("500");
    expect(v1.stakingPoolSuiBalance).toBe(mist(1_000));
    expect(v1.apy).toBe(0);
  });

  describe("APY computation", () => {
    it("should compute APY from a 30-epoch lookback rate per validator", async () => {
      // GIVEN
      // Pool current rate ratio 1.01 (1% above past).
      const CURRENT_EPOCH = 1000;
      const query = jest
        .fn()
        .mockResolvedValueOnce(
          fakeSystemStateQuery(String(CURRENT_EPOCH), [
            {
              poolId: "0xpA",
              suiBalance: 1_010_000,
              poolTokenBalance: 1_000_000,
              exchangeRatesId: "0xratesV",
            },
          ]),
        )
        .mockResolvedValueOnce(fakeUniformSingleRate());
      mockNext({ query });

      // WHEN
      const result = await getValidators(config);

      // THEN
      expect(result).toHaveLength(1);
      const v = result[0];
      // Past=1.0, current=1.01, 30 epochs → APY ≈ 1.01^(365/30) − 1 ≈ 0.1295
      expect(v.apy).toBeGreaterThan(0.12);
      expect(v.apy).toBeLessThan(0.14);

      // 1 plan < RATE_BATCH_CHUNK_SIZE → tail path (single query).
      expect(singleRateVars(query)).toEqual([
        { table: "0xratesV", literal: `${CURRENT_EPOCH - APY_LOOKBACK_EPOCHS}u64` },
      ]);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    it("should fan out a tail-sized validator set into parallel single-query rate fetches", async () => {
      // GIVEN
      const CURRENT_EPOCH = 1000;
      const lookback = `${CURRENT_EPOCH - APY_LOOKBACK_EPOCHS}u64`;
      const query = jest
        .fn()
        .mockResolvedValueOnce(
          fakeSystemStateQuery(String(CURRENT_EPOCH), [
            { poolId: "0xpA", exchangeRatesId: "0xratesA" },
            { poolId: "0xpB", exchangeRatesId: "0xratesB" },
            { poolId: "0xpC", exchangeRatesId: "0xratesC" },
          ]),
        )
        .mockResolvedValueOnce(fakeUniformSingleRate())
        .mockResolvedValueOnce(fakeUniformSingleRate())
        .mockResolvedValueOnce(fakeUniformSingleRate());
      mockNext({ query });

      // WHEN
      await getValidators(config);

      // THEN
      // 1 system-state + 3 parallel single-query rate fetches (N<RATE_BATCH_CHUNK_SIZE).
      expect(query).toHaveBeenCalledTimes(4);
      expect(singleRateVars(query)).toEqual([
        { table: "0xratesA", literal: lookback },
        { table: "0xratesB", literal: lookback },
        { table: "0xratesC", literal: lookback },
      ]);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    it("should ride BATCH_RATES_15 for full chunks and parallel singles for the tail", async () => {
      // GIVEN
      const FULL_CHUNK = RATE_BATCH_CHUNK_SIZE;
      const PARTIAL_CHUNK = 7;
      const N = FULL_CHUNK + PARTIAL_CHUNK;
      const validators = Array.from({ length: N }, (_, i) => ({
        poolId: `0xp${i}`,
        exchangeRatesId: `0xrates${i}`,
      }));
      const query = jest.fn().mockResolvedValueOnce(fakeSystemStateQuery("1000", validators));
      // Chunk 0 (size FULL_CHUNK) → one BATCH_RATES_15 round-trip.
      query.mockResolvedValueOnce(fakeUniformBatchRates(FULL_CHUNK));
      // Chunk 1 (size PARTIAL_CHUNK) → PARTIAL_CHUNK parallel single-query round-trips.
      for (let i = 0; i < PARTIAL_CHUNK; i++) {
        query.mockResolvedValueOnce(fakeUniformSingleRate());
      }
      mockNext({ query });

      // WHEN
      const result = await getValidators(config);

      // THEN
      expect(result).toHaveLength(N);
      expect(query).toHaveBeenCalledTimes(1 + 1 + PARTIAL_CHUNK);
      expect(batchExchangeRateCalls(query)).toHaveLength(1);
      expect(singleRateCalls(query)).toHaveLength(PARTIAL_CHUNK);
      // The single batch carries every variable for the full chunk.
      const batch = batchExchangeRateCalls(query)[0];
      expect(Object.keys(batch[0].variables)).toHaveLength(FULL_CHUNK * 2);
    });

    it("should clamp the past epoch to the pool's activation_epoch for young pools", async () => {
      // GIVEN
      // Pool only 5 epochs old — activation_epoch = 95. Desired lookback
      // 100 − 30 = 70 predates activation, so the helper clamps to 95.
      const query = jest
        .fn()
        .mockResolvedValueOnce(
          fakeSystemStateQuery("100", [
            { poolId: "0xpY", activationEpoch: 95, exchangeRatesId: "0xratesY" },
          ]),
        )
        .mockResolvedValueOnce(fakeUniformSingleRate());
      mockNext({ query });

      // WHEN
      await getValidators(config);

      // THEN
      expect(singleRateVars(query)).toEqual([{ table: "0xratesY", literal: "95u64" }]);
    });

    it("should return [] for an empty active_validators set without any rate fetch", async () => {
      // GIVEN
      const query = jest.fn().mockResolvedValueOnce(fakeSystemStateQuery("100", []));
      mockNext({ query });

      // WHEN
      const result = await getValidators(config);

      // THEN
      expect(result).toEqual([]);
      // No rate calls (single or batched) — no validators to plan for.
      expect(singleRateCalls(query)).toHaveLength(0);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("should degrade every validator to apy=0 when every rate lookup returns null", async () => {
      // GIVEN
      const query = jest
        .fn()
        .mockResolvedValueOnce(
          fakeSystemStateQuery("1000", [
            { poolId: "0xpA", exchangeRatesId: "0xratesA" },
            { poolId: "0xpB", exchangeRatesId: "0xratesB" },
            { poolId: "0xpC", exchangeRatesId: "0xratesC" },
          ]),
        )
        // All three rate lookups come back as `null` (table has no entry at the
        // requested epoch) — every validator must degrade to apy=0.
        .mockResolvedValueOnce(fakeSingleRate(null))
        .mockResolvedValueOnce(fakeSingleRate(null))
        .mockResolvedValueOnce(fakeSingleRate(null));
      mockNext({ query });

      // WHEN
      const result = await getValidators(config);

      // THEN
      expect(result).toHaveLength(3);
      expect(result.map(v => v.apy)).toEqual([0, 0, 0]);
    });
  });
});

// Unit-only by design: live broadcast has irreversible chain effects, so the
// mutation handler is exercised via mocks here. The integ suite never invokes
// `executeTransactionBlock` with `features.transport="graphql"` against mainnet.
describe("executeTransactionBlock on GraphQL transport (mock)", () => {
  it("should encode the BCS bytes as Base64 and forward the signatures verbatim", async () => {
    // GIVEN
    const txBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]); // 4-byte fixture
    const signatures = ["sig0-base64", "sig1-base64"];
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        executeTransaction: {
          effects: { digest: "0xabc123", status: "SUCCESS" },
        },
      },
    });
    mockNext({ query });

    // WHEN
    const result = await executeTransactionBlock(config, {
      transactionBlock: txBytes,
      signature: signatures,
    } as never);

    // THEN
    expect(query).toHaveBeenCalledTimes(1);
    const variables = query.mock.calls[0][0].variables;
    // BCS bytes 0xdeadbeef → "3q2+7w==" in standard Base64.
    expect(variables.transactionDataBcs).toBe("3q2+7w==");
    expect(variables.signatures).toEqual(signatures);
    expect(result).toMatchObject({ digest: "0xabc123" });
  });

  it("should accept a single signature string and lift it into the array form", async () => {
    // GIVEN
    const query = jest.fn().mockResolvedValueOnce({
      data: { executeTransaction: { effects: { digest: "0xfff", status: "SUCCESS" } } },
    });
    mockNext({ query });

    // WHEN
    await executeTransactionBlock(config, {
      transactionBlock: new Uint8Array([0]),
      signature: "single-sig",
    } as never);

    // THEN
    expect(query.mock.calls[0][0].variables.signatures).toEqual(["single-sig"]);
  });

  it("flags missing effects in the GraphQL response with a diagnostic error", async () => {
    // GIVEN — proxy/middleware stripped `effects`, mirroring the JSON-RPC null-effects path.
    const query = jest.fn().mockResolvedValueOnce({
      data: { executeTransaction: { effects: null } },
    });
    mockNext({ query });

    // WHEN
    const result = await executeTransactionBlock(config, {
      transactionBlock: new Uint8Array([0]),
      signature: "sig",
    } as never);

    // THEN — surfaced as failure with the same diagnostic string the JSON-RPC branch uses.
    expect(result.effects.status.status).toBe("failure");
    expect(result.effects.status.error).toBe("missing effects in broadcast response");
  });
});

// ---- graphqlFetcher: request-id stamping wrapper ----

describe("graphqlFetcher", () => {
  let originalFetch: typeof fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockResponse = (
    body: unknown,
    headers: Record<string, string> = {},
    init: ResponseInit = {},
  ) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json", ...headers },
      ...init,
    });

  it("passes through HTTP-error responses without parsing the body", async () => {
    const errBody = "not json at all <html>";
    mockFetch.mockResolvedValueOnce(
      new Response(errBody, { status: 502, headers: { "x-sui-rpc-request-id": "req-1" } }),
    );

    const res = await graphqlFetcher("https://endpoint/graphql", { method: "POST" });

    expect(res.status).toBe(502);
    expect(await res.text()).toBe(errBody);
  });

  it("passes through 200 responses that lack a request-id header verbatim", async () => {
    const body = { data: { foo: 1 } };
    mockFetch.mockResolvedValueOnce(mockResponse(body));

    const res = await graphqlFetcher("https://endpoint/graphql", { method: "POST" });

    expect(await res.json()).toEqual(body);
  });

  it("stamps __requestId on a parsed body when the header is present", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: { foo: 1 } }, { "x-sui-rpc-request-id": "req-stamped" }),
    );

    const res = await graphqlFetcher("https://endpoint/graphql", { method: "POST" });

    const json = (await res.json()) as { __requestId?: string; data: unknown };
    expect(json.__requestId).toBe("req-stamped");
    expect(json.data).toEqual({ foo: 1 });
  });

  it("strips content-encoding/content-length when re-emitting (decompressed body)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { data: {} },
        {
          "x-sui-rpc-request-id": "req-strip",
          "content-encoding": "gzip",
          "content-length": "99",
        },
      ),
    );

    const res = await graphqlFetcher("https://endpoint/graphql", { method: "POST" });

    expect(res.headers.get("content-encoding")).toBeNull();
    expect(res.headers.get("content-length")).toBeNull();
  });

  it("returns the raw response when the 200 body is not valid JSON", async () => {
    const text = "{ malformed";
    mockFetch.mockResolvedValueOnce(
      new Response(text, { status: 200, headers: { "x-sui-rpc-request-id": "req-bad-json" } }),
    );

    const res = await graphqlFetcher("https://endpoint/graphql", { method: "POST" });
    expect(await res.text()).toBe(text);
  });
});

// ---- getOperations GraphQL branch ----

describe("getOperations on GraphQL transport", () => {
  it("delegates to the affected-address paginator, drops settlement transactions, and maps to operations", async () => {
    const ADDR = addr("11");
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        transactions: {
          nodes: [
            {
              digest: "0xtx1",
              effects: {
                status: "SUCCESS",
                checkpoint: { sequenceNumber: 10, digest: "0xcp1" },
                timestamp: "2026-05-12T00:00:00.000Z",
              },
              transactionJson: { sender: ADDR, gasData: { owner: ADDR } },
            },
          ],
          pageInfo: { hasPreviousPage: false, startCursor: null },
        },
      },
    });
    mockNext({ query });

    const ops = await getOperations(config, "acc-1", ADDR, undefined, undefined);

    expect(query).toHaveBeenCalledTimes(1);
    expect(Array.isArray(ops)).toBe(true);
  });

  // The bridge sync path never revisits what it skipped — it always resumes from the newest stored
  // digest — so stopping after one page would cap an account at its newest 50 operations for good.
  it("walks past the first page until the connection is exhausted", async () => {
    const ADDR = addr("11");
    const node = (digest: string, sequenceNumber: number) => ({
      digest,
      effects: {
        status: "SUCCESS",
        checkpoint: { sequenceNumber, digest: `0xcp${sequenceNumber}` },
        timestamp: "2026-05-12T00:00:00.000Z",
      },
      transactionJson: { sender: ADDR, gasData: { owner: ADDR } },
    });
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        data: {
          transactions: {
            nodes: [node("0xtx50", 50)],
            pageInfo: { hasPreviousPage: true, startCursor: "cursor-page-2" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          transactions: {
            nodes: [node("0xtx1", 1)],
            pageInfo: { hasPreviousPage: false, startCursor: null },
          },
        },
      });
    mockNext({ query });

    const ops = await getOperations(config, "acc-1", ADDR, undefined, undefined);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0].variables.before).toBe("cursor-page-2");
    expect(ops.map(o => o.hash)).toEqual(["0xtx50", "0xtx1"]);
  });

  // Incremental sync resumes from the digest of the newest stored operation. That transaction's
  // checkpoint may hold siblings the previous sync never reached, so the bound has to keep it in
  // range; `mergeOps` dedupes whatever comes back twice.
  it("keeps the cursor's own checkpoint in range on an incremental sync", async () => {
    const ADDR = addr("11");
    const query = jest
      .fn()
      // 1. digest → checkpoint lookup for the incoming cursor
      .mockResolvedValueOnce({
        data: { transaction: { effects: { checkpoint: { sequenceNumber: 42 } } } },
      })
      // 2. the history page itself
      .mockResolvedValueOnce({
        data: {
          transactions: { nodes: [], pageInfo: { hasPreviousPage: false, startCursor: null } },
        },
      });
    mockNext({ query });

    await getOperations(config, "acc-1", ADDR, "0xcursorDigest", undefined);

    // `afterCheckpoint` is exclusive, so 41 is what keeps checkpoint 42 in range.
    expect(query.mock.calls[1][0].variables.afterCheckpoint).toBe(41);
  });

  // Clamping to 0 would send `afterCheckpoint: 0`, which — being exclusive — excludes checkpoint 0
  // and loses exactly what the inclusive bound exists to keep.
  it("sends no lower bound when the cursor sits in checkpoint zero", async () => {
    const ADDR = addr("11");
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        data: { transaction: { effects: { checkpoint: { sequenceNumber: 0 } } } },
      })
      .mockResolvedValueOnce({
        data: {
          transactions: { nodes: [], pageInfo: { hasPreviousPage: false, startCursor: null } },
        },
      });
    mockNext({ query });

    await getOperations(config, "acc-1", ADDR, "0xgenesisDigest", undefined);

    expect(query.mock.calls[1][0].variables.afterCheckpoint).toBeUndefined();
  });

  it("drops not-yet-finalized (indexing-lagged) nodes instead of mapping Failed/1970 ops", async () => {
    const ADDR = addr("11");
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        transactions: {
          nodes: [
            {
              digest: "0xfinalized",
              effects: {
                status: "SUCCESS",
                checkpoint: { sequenceNumber: 10, digest: "0xcp1" },
                timestamp: "2026-05-19T00:00:00.000Z",
              },
              transactionJson: { sender: ADDR, gasData: { owner: ADDR } },
            },
            // indexing lag: only the digest is known yet
            { digest: "0xlagged", effects: null, transactionJson: null },
          ],
          pageInfo: { hasPreviousPage: false, startCursor: null },
        },
      },
    });
    mockNext({ query });

    const ops = await getOperations(config, "acc-1", ADDR, undefined, undefined);
    const hashes = ops.map(o => o.hash);
    expect(hashes).toContain("0xfinalized");
    expect(hashes).not.toContain("0xlagged");
  });

  it("keeps a finalized FAILURE node (a real on-chain failure still shows)", async () => {
    const ADDR = addr("11");
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        transactions: {
          nodes: [
            {
              digest: "0xfail",
              effects: {
                status: "FAILURE",
                checkpoint: { sequenceNumber: 11, digest: "0xcp2" },
                timestamp: "2026-05-19T00:00:00.000Z",
                effectsJson: { status: { error: { description: "MoveAbort" } } },
              },
              transactionJson: { sender: ADDR, gasData: { owner: ADDR } },
            },
          ],
          pageInfo: { hasPreviousPage: false, startCursor: null },
        },
      },
    });
    mockNext({ query });

    const ops = await getOperations(config, "acc-1", ADDR, undefined, undefined);
    expect(ops.find(o => o.hash === "0xfail")?.hasFailed).toBe(true);
  });
});

describe("isFinalizedTxNode", () => {
  it("is true for a node with an effects.timestamp", () => {
    expect(
      isFinalizedTxNode({
        digest: "0x1",
        effects: { timestamp: "2026-05-19T00:00:00.000Z" },
      } as never),
    ).toBe(true);
  });

  it("is false for a node with null effects (indexing lag)", () => {
    expect(isFinalizedTxNode({ digest: "0x1", effects: null } as never)).toBe(false);
  });

  it("is false when effects carries no timestamp", () => {
    expect(isFinalizedTxNode({ digest: "0x1", effects: { status: "SUCCESS" } } as never)).toBe(
      false,
    );
  });
});

describe("getTransactionsWithCheckpointDigestsGraphQL", () => {
  const fakeApi = (query: jest.Mock): SuiGraphQLClient =>
    ({ query }) as unknown as SuiGraphQLClient;

  it("maps finalized nodes with their checkpoint digest and drops not-yet-finalized ones", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        transactions: {
          nodes: [
            // `last/before` yields ascending-within-page; the fn reverses to newest-first.
            { digest: "0xlagged", effects: null }, // indexing lag — no timestamp → dropped
            {
              digest: "0xfinal",
              effects: {
                status: "SUCCESS",
                timestamp: "2026-05-19T00:00:00.000Z",
                checkpoint: { sequenceNumber: 9, digest: "0xcpDigest" },
              },
              transactionJson: { sender: addr("11") },
            },
          ],
          pageInfo: { hasPreviousPage: true, hasNextPage: false },
        },
      },
    });

    const out = await getTransactionsWithCheckpointDigestsGraphQL(fakeApi(query), addr("11"), 50);

    expect(out.pairs).toHaveLength(1);
    expect(out.pairs[0].tx.digest).toBe("0xfinal");
    expect(out.pairs[0].checkpointDigest).toBe("0xcpDigest");
    // Surfaced rather than discarded: the caller gates `next` on it.
    expect(out.hasPreviousPage).toBe(true);
  });

  it("reports no further pages when the connection says so", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        transactions: { nodes: [], pageInfo: { hasPreviousPage: false, hasNextPage: false } },
      },
    });

    const out = await getTransactionsWithCheckpointDigestsGraphQL(fakeApi(query), addr("11"), 50);

    expect(out.pairs).toHaveLength(0);
    expect(out.hasPreviousPage).toBe(false);
  });
});

// Same invariant as the gRPC arm, documented on `dropOperationsBeforeCursor`: a page boundary can
// fall inside a checkpoint, so the server filter must keep that checkpoint in range.
describe("getListOperations cursor bounds on the GraphQL transport", () => {
  const TS_ISO = "2026-05-19T00:00:00.000Z";
  const TS = Date.parse(TS_ISO);

  const node = (digest: string, sequenceNumber: number, timestamp: string = TS_ISO) => ({
    digest,
    effects: {
      status: "SUCCESS",
      timestamp,
      checkpoint: { sequenceNumber, digest: `cp-${sequenceNumber}` },
    },
    transactionJson: { sender: addr("11") },
  });

  /**
   * First query resolves the cursor digest to a checkpoint; the rest serve pages in order.
   * `hasPreviousPage` defaults to true so a page can be short without ending the walk — the arm must
   * take that from the server, not from how many items survived the cursor drop.
   */
  const stub = (
    cursorCheckpoint: number | null,
    pages: unknown[][],
    hasPreviousPage: boolean = true,
    hasNextPage: boolean = false,
  ) => {
    const filters: ({ beforeCheckpoint?: number; afterCheckpoint?: number } | undefined)[] = [];
    const windows: { first: number | null; last: number | null }[] = [];
    let page = 0;
    const query = jest.fn(({ variables }: { variables?: Record<string, unknown> }) => {
      if (variables && "digest" in variables) {
        return Promise.resolve({
          data: {
            transaction:
              cursorCheckpoint === null
                ? null
                : { effects: { checkpoint: { sequenceNumber: cursorCheckpoint } } },
          },
        });
      }
      filters.push({
        ...(variables?.beforeCheckpoint !== undefined && {
          beforeCheckpoint: variables.beforeCheckpoint as number,
        }),
        ...(variables?.afterCheckpoint !== undefined && {
          afterCheckpoint: variables.afterCheckpoint as number,
        }),
      });
      windows.push({
        first: variables?.first as number | null,
        last: variables?.last as number | null,
      });
      const nodes = pages[Math.min(page++, pages.length - 1)];
      return Promise.resolve({
        data: { transactions: { nodes, pageInfo: { hasPreviousPage, hasNextPage } } },
      });
    });
    mockNext({ query });
    return { filters, windows };
  };

  it("keeps the cursor's own checkpoint in range when descending", async () => {
    const { filters } = stub(12, [[node("tx-a", 12), node("tx-m", 12)]]);

    const page = await getListOperations(config, addr("11"), "desc", undefined, `${TS}:tx-m`);

    // `beforeCheckpoint` is the exclusive upper bound, so 13 keeps checkpoint 12 in range.
    expect(filters[0]?.beforeCheckpoint).toBe(13);
    expect(page.items.map(op => op.tx.hash)).toEqual(["tx-a"]);
  });

  it("keeps the cursor's own checkpoint in range when ascending", async () => {
    const { filters } = stub(12, [[node("tx-a", 12), node("tx-m", 12)]]);

    const page = await getListOperations(config, addr("11"), "asc", undefined, `${TS}:tx-a`);

    expect(filters[0]?.afterCheckpoint).toBe(11);
    expect(page.items.map(op => op.tx.hash)).toEqual(["tx-m"]);
  });

  it("steps past the cursor's checkpoint when a full page of it is already seen", async () => {
    const stalled = Array.from({ length: 50 }, (_, i) =>
      node(`tx-${String(i + 1).padStart(3, "0")}`, 12),
    );
    const { filters } = stub(12, [stalled, [node("tx-older", 11, "2026-05-18T00:00:00.000Z")]]);

    const page = await getListOperations(config, addr("11"), "desc", undefined, `${TS}:tx-000`);

    expect(filters).toHaveLength(2);
    expect(filters[0]?.beforeCheckpoint).toBe(13);
    expect(filters[1]?.beforeCheckpoint).toBe(12);
    expect(page.items.map(op => op.tx.hash)).toEqual(["tx-older"]);
  });

  // Guards the consequence documented on `dropOperationsBeforeCursor`: a cursor-fed page cannot reach
  // the page size, so a count-based `next` gate would end the walk at page two.
  it("keeps paginating when the cursor's own checkpoint fills the page", async () => {
    const TS_OLDER = "2026-05-18T00:00:00.000Z";
    const full = [
      node("tx-cursor", 12),
      ...Array.from({ length: 49 }, (_, i) =>
        node(`tx-${String(i).padStart(3, "0")}`, 11, TS_OLDER),
      ),
    ];
    const { filters } = stub(12, [full]);

    const page = await getListOperations(config, addr("11"), "desc", undefined, `${TS}:tx-cursor`);

    expect(filters[0]?.beforeCheckpoint).toBe(13);
    expect(page.items).toHaveLength(49);
    // Equal timestamps sort by digest descending, so the oldest delivered item is `tx-000`.
    expect(page.next).toBe(`${Date.parse(TS_OLDER)}:tx-000`);
  });

  // The window must match the direction of travel — see `TRANSACTIONS_BY_AFFECTED_ADDRESS`. Using
  // `last:` for an ascending walk returns the newest page and skips everything older.
  it("requests the oldest slice when walking ascending", async () => {
    const { windows, filters } = stub(12, [[node("tx-a", 12)]]);

    await getListOperations(config, addr("11"), "asc", undefined, `${TS}:tx-cursor`);

    expect(windows[0]).toEqual({ first: 50, last: null });
    expect(filters[0]?.afterCheckpoint).toBe(11);
  });

  it("requests the newest slice when walking descending", async () => {
    const { windows } = stub(12, [[node("tx-a", 12)]]);

    await getListOperations(config, addr("11"), "desc", undefined, `${TS}:tx-cursor`);

    expect(windows[0]).toEqual({ first: null, last: 50 });
  });

  // Ascending reads "more to come" from `hasNextPage`, the mirror of `hasPreviousPage` for descending.
  it("keeps paginating ascending while newer transactions remain", async () => {
    const TS_NEWER = "2026-05-20T00:00:00.000Z";
    const full = Array.from({ length: 50 }, (_, i) =>
      node(`tx-${String(i).padStart(3, "0")}`, 13, TS_NEWER),
    );
    stub(12, [full], true, true);

    const page = await getListOperations(config, addr("11"), "asc", undefined, `${TS}:tx-cursor`);

    expect(page.items).toHaveLength(50);
    expect(page.next).toEqual(expect.any(String));
  });

  it("stops ascending when no newer transactions remain", async () => {
    const TS_NEWER = "2026-05-20T00:00:00.000Z";
    const full = Array.from({ length: 50 }, (_, i) =>
      node(`tx-${String(i).padStart(3, "0")}`, 13, TS_NEWER),
    );
    stub(12, [full], true, false);

    const page = await getListOperations(config, addr("11"), "asc", undefined, `${TS}:tx-cursor`);

    expect(page.items).toHaveLength(50);
    expect(page.next).toBeUndefined();
  });

  // Same clamp trap on the paging path: ascending from genesis must drop the bound, not send
  // `afterCheckpoint: 0`, which would exclude checkpoint 0.
  it("sends no lower bound when paging ascending from checkpoint zero", async () => {
    const { filters } = stub(0, [[node("tx-a", 0)]]);

    await getListOperations(config, addr("11"), "asc", undefined, `${TS}:tx-cursor`);

    expect(filters[0]?.afterCheckpoint).toBeUndefined();
  });

  // The complement: the server's answer decides, so a full page with `hasPreviousPage: false` ends
  // the walk. Counting items would have kept it going.
  it("stops when the server reports no further pages", async () => {
    const full = Array.from({ length: 50 }, (_, i) => node(`tx-${String(i).padStart(3, "0")}`, 11));
    stub(12, [full], false);

    const page = await getListOperations(config, addr("11"), "desc", undefined, `${TS}:tx-cursor`);

    expect(page.items).toHaveLength(50);
    expect(page.next).toBeUndefined();
  });
});

// ---- getStakingExtraByDigest (legacy backfill) GraphQL branch ----

describe("getStakingExtraByDigest on GraphQL transport", () => {
  const eventsResponse = (repr: string, json: Record<string, string>) => ({
    data: {
      transaction: { effects: { events: { nodes: [{ contents: { type: { repr }, json } }] } } },
    },
  });

  it("reads validator_address + amount from StakingRequestEvent (DELEGATE)", async () => {
    // Long-padded `repr` as the live GraphQL server actually returns it — exercises the
    // `toShortStructTag` shortening the type-match in `getStakingEventsByDigestGraphQL` depends on.
    const query = jest.fn().mockResolvedValueOnce(
      eventsResponse(
        "0x0000000000000000000000000000000000000000000000000000000000000003::validator::StakingRequestEvent",
        {
          validator_address: "0xval1",
          amount: "1000000000",
        },
      ),
    );
    mockNext({ query });
    const out = await getStakingExtraByDigest(config, "0xdigest", "DELEGATE");
    expect(out).toEqual({ validatorAddress: "0xval1", stakedAmount: "1000000000" });
  });

  it("reads validator_address + principal_amount from UnstakingRequestEvent (UNDELEGATE)", async () => {
    const query = jest.fn().mockResolvedValueOnce(
      eventsResponse("0x3::validator::UnstakingRequestEvent", {
        validator_address: "0xval2",
        principal_amount: "500000000",
      }),
    );
    mockNext({ query });
    const out = await getStakingExtraByDigest(config, "0xdigest", "UNDELEGATE");
    expect(out).toEqual({ validatorAddress: "0xval2", stakedAmount: "500000000" });
  });

  it("returns null when the digest has no matching staking event", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ data: { transaction: { effects: { events: { nodes: [] } } } } });
    mockNext({ query });
    const out = await getStakingExtraByDigest(config, "0xmissing", "DELEGATE");
    expect(out).toBeNull();
  });

  it("short-circuits to null without a network call for non-staking op types", async () => {
    const query = jest.fn();
    mockNext({ query });
    const out = await getStakingExtraByDigest(config, "0xdigest", "OUT");
    expect(out).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
});

// ---- simulateTransactionGraphQL direct ----

describe("simulateTransactionGraphQL", () => {
  /** Direct call bypasses the paymentInfo dispatcher (which would need full coin-selection mocks). */
  const fakeApi = (query: jest.Mock): SuiGraphQLClient =>
    ({ query }) as unknown as SuiGraphQLClient;

  it("projects gasBudget + cost components from the SimulateTransaction response", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        simulateTransaction: {
          effects: {
            transaction: { gasInput: { gasBudget: "5000000" } },
            gasEffects: {
              gasSummary: {
                computationCost: "1000",
                storageCost: "500",
                storageRebate: "200",
              },
            },
          },
        },
      },
    });

    const sim = await simulateTransactionGraphQL(fakeApi(query), "deadbeef");

    expect(sim.gasBudget).toBe("5000000");
    expect(sim.computationCost).toBe("1000");
    expect(sim.storageCost).toBe("500");
    expect(sim.storageRebate).toBe("200");
  });

  it("falls back to '0' for every missing field", async () => {
    const query = jest.fn().mockResolvedValueOnce({ data: { simulateTransaction: {} } });
    const sim = await simulateTransactionGraphQL(fakeApi(query), "deadbeef");
    expect(sim).toEqual({
      gasBudget: "0",
      computationCost: "0",
      storageCost: "0",
      storageRebate: "0",
    });
  });

  it("base64-encodes a Uint8Array payload before sending", async () => {
    const query = jest.fn().mockResolvedValueOnce({ data: { simulateTransaction: {} } });
    await simulateTransactionGraphQL(fakeApi(query), new Uint8Array([1, 2, 3, 4]));
    expect(query.mock.calls[0][0].variables.transaction.bcs.value).toBe("AQIDBA==");
  });
});

// ---- executeTransactionGraphQL ----

describe("executeTransactionGraphQL", () => {
  const fakeApi = (query: jest.Mock): SuiGraphQLClient =>
    ({ query }) as unknown as SuiGraphQLClient;

  it("returns digest + SUCCESS status with no error field on a successful broadcast", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        executeTransaction: {
          effects: { digest: "0xabc", status: "SUCCESS", effectsJson: {} },
        },
      },
    });
    const out = await executeTransactionGraphQL(fakeApi(query), "deadbeef", ["sig1"]);
    expect(out.digest).toBe("0xabc");
    expect(out.status).toBe("SUCCESS");
    expect(out.error).toBeUndefined();
  });

  it("mines the failure description from effectsJson on FAILURE", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        executeTransaction: {
          effects: {
            digest: "0xfail",
            status: "FAILURE",
            effectsJson: { status: { error: { description: "GasOverflow" } } },
          },
        },
      },
    });
    const out = await executeTransactionGraphQL(fakeApi(query), "deadbeef", []);
    expect(out.status).toBe("FAILURE");
    expect(out.error).toBe("GasOverflow");
  });

  it("returns status null and empty digest when effects is absent", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: { executeTransaction: { effects: null } },
    });
    const out = await executeTransactionGraphQL(fakeApi(query), "deadbeef", []);
    expect(out.status).toBeNull();
    expect(out.digest).toBe("");
    expect(out.error).toBeUndefined();
  });

  it("base64-encodes a Uint8Array transactionDataBcs before sending", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: { executeTransaction: { effects: { digest: "0x", status: "SUCCESS" } } },
    });
    await executeTransactionGraphQL(fakeApi(query), new Uint8Array([1, 2, 3]), ["sig"]);
    expect(query.mock.calls[0][0].variables.transactionDataBcs).toBe("AQID");
    expect(query.mock.calls[0][0].variables.signatures).toEqual(["sig"]);
  });
});

// ---- getBlockInfoFieldsGraphQL ----

describe("getBlockInfoFieldsGraphQL", () => {
  const fakeApi = (query: jest.Mock): SuiGraphQLClient =>
    ({ query }) as unknown as SuiGraphQLClient;

  it("projects digest/sequenceNumber/timestampMs/previousDigest", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "0xdgst",
          sequenceNumber: 42,
          timestamp: "2026-01-01T00:00:00Z",
          previousCheckpointDigest: "0xprev",
        },
      },
    });
    const out = await getBlockInfoFieldsGraphQL(fakeApi(query), 42);
    expect(out).toEqual({
      digest: "0xdgst",
      sequenceNumber: "42",
      timestampMs: String(Date.parse("2026-01-01T00:00:00Z")),
      previousDigest: "0xprev",
    });
  });

  it("returns null when the checkpoint is absent", async () => {
    const query = jest.fn().mockResolvedValueOnce({ data: { checkpoint: null } });
    const out = await getBlockInfoFieldsGraphQL(fakeApi(query), 0);
    expect(out).toBeNull();
  });

  // `digest` and `timestamp` are nullable in the schema. Coercing them would report a block with an
  // empty hash or a 1970 timestamp, which sync stores as if it were real; JSON-RPC cannot produce
  // either, so the GraphQL arm fails instead.
  it.each([
    ["digest", { digest: null, timestamp: "2026-01-01T00:00:00Z" }, /has no digest/],
    ["timestamp", { digest: "d", timestamp: null }, /has no timestamp/],
    ["parseable timestamp", { digest: "d", timestamp: "not-a-date" }, /unparseable timestamp/],
  ])("throws when the checkpoint has no %s", async (_label, fields, expected) => {
    const query = jest.fn().mockResolvedValueOnce({
      data: { checkpoint: { sequenceNumber: 1, previousCheckpointDigest: null, ...fields } },
    });

    await expect(getBlockInfoFieldsGraphQL(fakeApi(query), 1)).rejects.toThrow(expected);
  });

  it("returns the metadata when every nullable field is populated", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "d",
          sequenceNumber: 1,
          timestamp: "2026-01-01T00:00:00Z",
          previousCheckpointDigest: null,
        },
      },
    });

    const out = await getBlockInfoFieldsGraphQL(fakeApi(query), 1);

    expect(out?.timestampMs).toBe(String(Date.parse("2026-01-01T00:00:00Z")));
    expect(out?.previousDigest).toBeNull();
  });
});

// ---- resolveCheckpointSequenceForDigestGraphQL ----

describe("resolveCheckpointSequenceForDigestGraphQL", () => {
  const fakeApi = (query: jest.Mock): SuiGraphQLClient =>
    ({ query }) as unknown as SuiGraphQLClient;

  it("returns the resolved sequence number as a JS number", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: { transaction: { effects: { checkpoint: { sequenceNumber: 1234 } } } },
    });
    const out = await resolveCheckpointSequenceForDigestGraphQL(fakeApi(query), "0xdgst");
    expect(out).toBe(1234);
  });

  it("returns null when the digest doesn't resolve to a finalised checkpoint", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: { transaction: { effects: { checkpoint: null } } },
    });
    const out = await resolveCheckpointSequenceForDigestGraphQL(fakeApi(query), "0xdgst");
    expect(out).toBeNull();
  });

  it("returns null when the transaction itself is missing", async () => {
    const query = jest.fn().mockResolvedValueOnce({ data: { transaction: null } });
    const out = await resolveCheckpointSequenceForDigestGraphQL(fakeApi(query), "0xdgst");
    expect(out).toBeNull();
  });
});

// ---- getBlockGraphQL (paginated) ----

describe("getBlockGraphQL", () => {
  const fakeApi = (query: jest.Mock): SuiGraphQLClient =>
    ({ query }) as unknown as SuiGraphQLClient;

  const txNode = (digest: string) => ({
    digest,
    transactionJson: null,
    effects: null,
  });

  it("returns null when the checkpoint is missing on the first page", async () => {
    const query = jest.fn().mockResolvedValueOnce({ data: { checkpoint: null } });
    const out = await getBlockGraphQL(fakeApi(query), 100);
    expect(out).toBeNull();
  });

  it("returns metadata + transactions from a single page when there is no next page", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "0xdgst",
          sequenceNumber: 100,
          timestamp: "2026-01-01T00:00:00Z",
          previousCheckpointDigest: "0xprev",
          transactions: {
            nodes: [txNode("0xt1"), txNode("0xt2")],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    });
    const out = await getBlockGraphQL(fakeApi(query), 100);
    expect(out?.info.digest).toBe("0xdgst");
    expect(out?.info.sequenceNumber).toBe("100");
    expect(out?.transactions).toHaveLength(2);
    expect(out?.transactions[0].digest).toBe("0xt1");
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("paginates with txAfter and accumulates transactions across pages; metadata is from page 1 only", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        data: {
          checkpoint: {
            digest: "0xdgst",
            sequenceNumber: 100,
            timestamp: "2026-01-01T00:00:00Z",
            previousCheckpointDigest: null,
            transactions: {
              nodes: [txNode("0xt1"), txNode("0xt2")],
              pageInfo: { hasNextPage: true, endCursor: "cursor-1" },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          checkpoint: {
            digest: "ignored-second-page-metadata",
            sequenceNumber: 999,
            timestamp: "2099-01-01T00:00:00Z",
            previousCheckpointDigest: "should-not-replace",
            transactions: {
              nodes: [txNode("0xt3")],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      });
    const out = await getBlockGraphQL(fakeApi(query), 100);
    expect(out?.transactions.map(t => t.digest)).toEqual(["0xt1", "0xt2", "0xt3"]);
    // Metadata was captured from page 1; second-page metadata must NOT overwrite.
    expect(out?.info.digest).toBe("0xdgst");
    expect(out?.info.sequenceNumber).toBe("100");
    expect(out?.info.previousDigest).toBeNull();
    // Second call should carry txAfter=cursor-1.
    expect(query.mock.calls[1][0].variables.txAfter).toBe("cursor-1");
    // First call must NOT carry txAfter (initial page) — undefined since exactOptionalPropertyTypes.
    expect(query.mock.calls[0][0].variables.txAfter).toBeUndefined();
  });

  it("stops pagination when hasNextPage is true but endCursor is null (defensive)", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "d",
          sequenceNumber: 1,
          timestamp: "2026-01-01T00:00:00Z",
          previousCheckpointDigest: null,
          transactions: {
            nodes: [txNode("0xt1")],
            pageInfo: { hasNextPage: true, endCursor: null },
          },
        },
      },
    });
    const out = await getBlockGraphQL(fakeApi(query), 1);
    expect(out?.transactions).toHaveLength(1);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("throws on cap hit rather than silently truncating", async () => {
    // Build a fake API that always reports hasNextPage=true so we run all MAX_PAGES iterations.
    const ALWAYS_MORE = {
      data: {
        checkpoint: {
          digest: "0xdgst",
          sequenceNumber: 1,
          timestamp: "2026-01-01T00:00:00Z",
          previousCheckpointDigest: null,
          transactions: {
            nodes: [txNode("0xt")],
            pageInfo: { hasNextPage: true, endCursor: "more" },
          },
        },
      },
    };
    const query = jest.fn().mockResolvedValue(ALWAYS_MORE);
    await expect(getBlockGraphQL(fakeApi(query), 1)).rejects.toThrow(/pagination cap hit/);
  });
});
