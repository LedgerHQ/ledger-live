import { createSuiGraphQLClient } from "./graphql/client";
import coinConfig from "../config";
import { mist } from "../constants";
import { GRAPHQL_MAINNET_URL, STAKES_PAGE_SIZE } from "./graphql/constants";
import { UNKNOWN_VALIDATOR } from "./graphql/utils";
import { getAllBalancesCached, getCheckpoint, getLastBlock, getDelegatedStakes } from "./sdk";
import {
  addr,
  batchExchangeRateCalls,
  bindMockNextGraphQLClient,
  expectActive,
  fakeBalance,
  fakeBalancesPage,
  fakeStakeNode,
  fakeStakesPage,
  fakeSystemStateQuery,
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
  // Default-on: every test in this suite needs the GraphQL branch.
  coinConfig.setCoinConfig(() => ({
    node: { url: GRAPHQL_MAINNET_URL, graphqlUrl: GRAPHQL_MAINNET_URL },
    status: { type: "active" },
    features: { graphql: true },
  }));
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
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-1");

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
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-pagination");

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
      const result = await getAllBalancesCached(owner, "sui-graphql-balance-cursor-expiry");

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
    const query = jest
      .fn()
      // 1. LATEST_CHECKPOINT_SEQUENCE — server returns UInt53 as a number
      .mockResolvedValueOnce({
        data: { checkpoint: { sequenceNumber: 12345 } },
      })
      // 2. CHECKPOINT_BY_SEQUENCE
      .mockResolvedValueOnce({
        data: {
          checkpoint: {
            digest: "AbCdEfDigestZ",
            sequenceNumber: 12345,
            timestamp: isoTimestamp,
          },
        },
      });
    mockNext({ query });

    // WHEN
    const result = await getLastBlock("sui-graphql-last-block");

    // THEN
    expect(result).toEqual({
      digest: "AbCdEfDigestZ",
      // Returned shape converts UInt53 back to a string for downstream
      // JSON-RPC compatibility.
      sequenceNumber: "12345",
      timestampMs: String(new Date(isoTimestamp).getTime()),
    });
    expect(query).toHaveBeenCalledTimes(2);
    // CHECKPOINT_BY_SEQUENCE variable must be a number — the server
    // rejects quoted-string UInt53 inputs in production.
    expect(query.mock.calls[1][0].variables).toEqual({ sequenceNumber: 12345 });
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
    const result = await getCheckpoint("99", "sui-graphql-checkpoint-1");

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
    await expect(getCheckpoint(digest, "sui-graphql-checkpoint-2")).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    // Guard runs before withGraphQLApi — no client should be constructed.
    expect(factoryMock).not.toHaveBeenCalled();
  });

  it("should reject numeric input above MAX_SAFE_INTEGER (would lose precision)", async () => {
    // 16-digit number > 2^53-1: routing it through `Number(id)` silently rounds
    // and would query the wrong checkpoint. UInt53 schema rejects unsafe values.
    const unsafe = "9999999999999999";
    await expect(getCheckpoint(unsafe, "sui-graphql-checkpoint-unsafe")).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    expect(factoryMock).not.toHaveBeenCalled();
  });

  it("should propagate the server's error message", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "Checkpoint out of available range" }],
    });
    mockNext({ query });

    await expect(getCheckpoint("9999999", "sui-graphql-checkpoint-3")).rejects.toThrow(
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
    const result = await getDelegatedStakes(owner, "sui-graphql-stakes-1");

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
    const result = await getDelegatedStakes(owner, "sui-graphql-stakes-pagination");

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
    const result = await getDelegatedStakes(owner, "sui-graphql-stakes-orphan");

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
    await getDelegatedStakes("0x42", "sui-graphql-stakes-norm");

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
      const result = await getDelegatedStakes(owner, "sui-graphql-stakes-reward");

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
      await getDelegatedStakes(owner, "sui-graphql-stakes-dedup");

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
      const result = await getDelegatedStakes(owner, "sui-graphql-stakes-pending-only");

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
      const result = await getDelegatedStakes(owner, "sui-graphql-stakes-cursor-expiry");

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
      await expect(
        getDelegatedStakes(owner, "sui-graphql-stakes-cursor-expiry-double"),
      ).rejects.toThrow(/outside available range/);
    });
  });

});
