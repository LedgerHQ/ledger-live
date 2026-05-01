import { SuiGraphQLClient } from "@mysten/sui/graphql";
import coinConfig from "../config";
import { mist } from "../constants";
import {
  APY_LOOKBACK_EPOCHS,
  GRAPHQL_MAINNET_URL,
  RATE_BATCH_CHUNK_SIZE,
  STAKES_PAGE_SIZE,
} from "./graphql/constants";
import { UNKNOWN_VALIDATOR } from "./graphql/utils";
import {
  getAllBalancesCached,
  getCheckpoint,
  getLastBlock,
  getStakesRaw,
  getValidators,
} from "./sdk";
import {
  addr,
  batchExchangeRateCalls,
  bindMockNextGraphQLClient,
  expectActive,
  fakeBalance,
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

jest.mock("@mysten/sui/graphql", () => ({
  SuiGraphQLClient: jest.fn(),
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

const SuiGraphQLClientMock = SuiGraphQLClient as unknown as jest.Mock;
const mockNext = bindMockNextGraphQLClient(SuiGraphQLClientMock);

beforeEach(() => {
  SuiGraphQLClientMock.mockReset();
  unexpectedJsonRpc.mockClear();
  // Default-on: every test in this suite needs the GraphQL branch.
  coinConfig.setCoinConfig(() => ({
    node: { url: GRAPHQL_MAINNET_URL },
    status: { type: "active" },
    features: { graphql: true },
  }));
});

describe("getAllBalancesCached on GraphQL transport", () => {
  test("calls listBalances and remaps addressBalance to fundsInAddressBalance", async () => {
    const client = mockNext({
      listBalances: jest.fn().mockResolvedValueOnce({
        balances: [
          fakeBalance("0x2::sui::SUI", mist(1), mist(0.4)),
          fakeBalance("0x9::usdc::USDC", "500000"),
        ],
        hasNextPage: false,
        cursor: null,
      }),
    });

    const owner = addr("11");
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-1");

    expect(result).toEqual([
      {
        coinType: "0x2::sui::SUI",
        coinObjectCount: 0,
        totalBalance: mist(1),
        lockedBalance: {},
        fundsInAddressBalance: mist(0.4),
      },
      {
        coinType: "0x9::usdc::USDC",
        coinObjectCount: 0,
        totalBalance: "500000",
        lockedBalance: {},
        fundsInAddressBalance: "0",
      },
    ]);
    expect(client.listBalances).toHaveBeenCalledTimes(1);
    expect(client.listBalances).toHaveBeenCalledWith({ owner, cursor: null });
  });

  test("paginates through BalanceConnection until hasNextPage is false", async () => {
    const listBalances = jest
      .fn()
      .mockResolvedValueOnce({
        balances: [fakeBalance("0xA::a::A", "1")],
        hasNextPage: true,
        cursor: "cursor1",
      })
      .mockResolvedValueOnce({
        balances: [fakeBalance("0xB::b::B", "2")],
        hasNextPage: false,
        cursor: null,
      });
    mockNext({ listBalances });

    const owner = addr("22");
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-pagination");

    expect(result).toHaveLength(2);
    expect(result.map(b => b.coinType)).toEqual(["0xA::a::A", "0xB::b::B"]);
    expect(listBalances).toHaveBeenCalledTimes(2);
    expect(listBalances).toHaveBeenNthCalledWith(1, { owner, cursor: null });
    expect(listBalances).toHaveBeenNthCalledWith(2, { owner, cursor: "cursor1" });
  });

  describe("cursor-expiry retry", () => {
    test("restarts pagination from page 1 when a next-page listBalances throws cursor-expired", async () => {
      const owner = addr("aa");
      const expired = new Error("Pagination cursor outside the available range");
      const listBalances = jest
        .fn()
        // 1. initial: 1 balance, hasNextPage: true
        .mockResolvedValueOnce({
          balances: [fakeBalance("0x2::sui::SUI", "100")],
          hasNextPage: true,
          cursor: "stale",
        })
        // 2. next page (cursor: "stale") → throws cursor-expired
        .mockRejectedValueOnce(expired)
        // 3. retry: fresh page 1, hasNextPage: false
        .mockResolvedValueOnce({
          balances: [fakeBalance("0x2::sui::SUI", "200")],
          hasNextPage: false,
          cursor: null,
        });
      mockNext({ listBalances });

      const result = await getAllBalancesCached(owner, "sui-graphql-balance-cursor-expiry");

      // Pre-retry balance is discarded; only post-retry survives.
      expect(result).toEqual([
        {
          coinType: "0x2::sui::SUI",
          coinObjectCount: 0,
          totalBalance: "200",
          lockedBalance: {},
          fundsInAddressBalance: "0",
        },
      ]);
      expect(listBalances).toHaveBeenCalledTimes(3);
      expect(listBalances).toHaveBeenNthCalledWith(1, { owner, cursor: null });
      expect(listBalances).toHaveBeenNthCalledWith(2, { owner, cursor: "stale" });
      expect(listBalances).toHaveBeenNthCalledWith(3, { owner, cursor: null });
    });
  });
});

describe("getLastBlock on GraphQL transport", () => {
  test("queries latest checkpoint then resolves digest+timestamp via sequence", async () => {
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

    const result = await getLastBlock("sui-graphql-last-block");

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
  test("sequence-number lookup happy path", async () => {
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

    const result = await getCheckpoint("99", "sui-graphql-checkpoint-1");

    expect(result.digest).toBe("DigestForSeq99");
    expect(result.sequenceNumber).toBe("99");
    expect(result.timestampMs).toBe(String(new Date(isoTimestamp).getTime()));
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0].variables).toEqual({ sequenceNumber: 99 });
  });

  test("digest lookup throws a clear error on GraphQL endpoint", async () => {
    // 32-byte digest, base58-ish — anything non-numeric.
    const digest = "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt";
    await expect(getCheckpoint(digest, "sui-graphql-checkpoint-2")).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    // Guard runs before withGraphQLApi — no client should be constructed.
    expect(SuiGraphQLClientMock).not.toHaveBeenCalled();
  });

  test("propagates GraphQL errors with a descriptive message", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "Checkpoint out of available range" }],
    });
    mockNext({ query });

    await expect(getCheckpoint("9999999", "sui-graphql-checkpoint-3")).rejects.toThrow(
      /Checkpoint out of available range/,
    );
  });
});

describe("getStakesRaw on GraphQL transport", () => {
  /** Pending-status stake — used by tests that don't care about reward math. */
  const pendingStake = (id: string, pool_id = "0xp") =>
    fakeStakeNode({ id, pool_id, stake_activation_epoch: "200", principal: "1" });

  test("groups StakedSui objects by pool, joins validator address from system state, and computes status", async () => {
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

    const result = await getStakesRaw(owner, "sui-graphql-stakes-1");

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

  test("paginates StakedSui object listings", async () => {
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

    const result = await getStakesRaw(owner, "sui-graphql-stakes-pagination");
    expect(result).toHaveLength(1);
    expect(result[0].stakes).toHaveLength(2);
    // Second StakedSui page request should pass `after: "p1"`.
    const calls = stakeQueryCalls(query);
    expect(calls[1][0].variables).toEqual({ owner, first: STAKES_PAGE_SIZE, after: "p1" });
  });

  test("falls back to '<unknown>' validatorAddress when pool isn't in active_validators", async () => {
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

    const result = await getStakesRaw(owner, "sui-graphql-stakes-orphan");
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

  test("normalises owner to canonical 32-byte form across initial + paginated queries", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce(fakeSystemStateQuery("100", [{ poolId: "0xp" }]))
      .mockResolvedValueOnce(
        fakeStakesPage([pendingStake("0xa")], { hasNextPage: true, endCursor: "c1" }),
      )
      .mockResolvedValueOnce(fakeStakesPage([pendingStake("0xb")]));
    mockNext({ query });

    await getStakesRaw("0x42", "sui-graphql-stakes-norm");

    const expected = "0x" + "0".repeat(62) + "42";
    const calls = stakeQueryCalls(query);
    expect(calls).toHaveLength(2);
    expect(calls[0][0].variables.owner).toBe(expected);
    expect(calls[1][0].variables.owner).toBe(expected);
  });

  describe("reward computation", () => {
    test("fetches activation-epoch rate per Active stake and computes real estimatedReward", async () => {
      const owner = addr("66");
      const POOL = "0xpoolReward";

      // Pool current rate (sui_balance/pool_token_balance from system state):
      //   sui_balance = 1_100_000 ; pool_token_balance = 1_000_000  → ratio 1.1
      // Activation rate at epoch 50: ratio 1.0
      // Stake of 100 principal:
      //   pool_tokens = 100 * 1_000_000 / 1_000_000 = 100
      //   current_value = 100 * 1_100_000 / 1_000_000 = 110
      //   estimatedReward = 10
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

      const result = await getStakesRaw(owner, "sui-graphql-stakes-reward");
      expect(result).toHaveLength(1);
      const stk = result[0].stakes[0];
      expectActive(stk);
      expect(stk.estimatedReward).toBe("10");

      // Exactly one EXCHANGE_RATE_AT_EPOCH call, no batch.
      expect(singleRateVars(query)).toEqual([{ table: "0xratesReward", literal: "50u64" }]);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    test("deduplicates rate lookups when multiple stakes share (pool, activation_epoch)", async () => {
      const owner = addr("77");
      const POOL = "0xpoolDedup";

      // Three stakes — A and B share (pool, epoch=50), C is different epoch.
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

      await getStakesRaw(owner, "sui-graphql-stakes-dedup");

      // 3 stakes → de-duped to 2 unique tuples → 2 parallel single-query round-trips.
      const vars = singleRateVars(query);
      expect(vars).toHaveLength(2);
      expect(new Set(vars.map(v => v.literal))).toEqual(new Set(["50u64", "60u64"]));
      expect(vars.every(v => v.table === "0xratesDedup")).toBe(true);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    test("Pending stakes don't trigger rate lookups", async () => {
      const owner = addr("88");
      const POOL = "0xpoolPending";

      const query = jest
        .fn()
        .mockResolvedValueOnce(fakeSystemStateQuery("100", [{ poolId: POOL }]))
        .mockResolvedValueOnce(fakeStakesPage([pendingStake("0xpending", POOL)]));
      mockNext({ query });

      const result = await getStakesRaw(owner, "sui-graphql-stakes-pending-only");
      expect(result[0].stakes[0].status).toBe("Pending");

      // No rate calls (single or batched) — Pending stakes have no reward.
      expect(singleRateCalls(query)).toHaveLength(0);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });
  });

  describe("cursor-expiry retry", () => {
    test("restarts pagination from page 1 when a next-page cursor is rejected as out-of-range", async () => {
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

      const result = await getStakesRaw(owner, "sui-graphql-stakes-cursor-expiry");

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

    test("does not retry indefinitely — second cursor-expiry propagates", async () => {
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

      await expect(getStakesRaw(owner, "sui-graphql-stakes-cursor-expiry-double")).rejects.toThrow(
        /outside available range/,
      );
    });
  });
});

describe("getValidators on GraphQL transport", () => {
  test("maps active_validators to SuiValidatorSummary[] and falls back to apy=0 when rate fetch fails", async () => {
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

    const result = await getValidators("sui-graphql-validators-1");
    expect(result).toHaveLength(2);

    const v1 = result.find(v => v.suiAddress === "0xv1")!;
    expect(v1.name).toBe("V1");
    expect(v1.description).toBe("desc");
    expect(v1.imageUrl).toBe("https://logo");
    expect(v1.projectUrl).toBe("https://project");
    expect(v1.commissionRate).toBe("500");
    expect(v1.stakingPoolSuiBalance).toBe(mist(1_000));
    expect(v1.apy).toBe(0);
    expect(v1.exchangeRatesId).toBe("0xrates");
    expect(v1.exchangeRatesSize).toBe("100");
  });

  describe("APY computation", () => {
    test("fetches a 30-epoch-lookback rate per validator and computes real APY", async () => {
      const CURRENT_EPOCH = 1000;
      // Pool current rate ratio 1.01 (1% above past).
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

      const result = await getValidators("sui-graphql-validators-apy");
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

    test("fans out a tail-sized validator set into parallel single-query rate fetches", async () => {
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

      await getValidators("sui-graphql-validators-batch");

      // 1 system-state + 3 parallel single-query rate fetches (N<RATE_BATCH_CHUNK_SIZE).
      expect(query).toHaveBeenCalledTimes(4);
      expect(singleRateVars(query)).toEqual([
        { table: "0xratesA", literal: lookback },
        { table: "0xratesB", literal: lookback },
        { table: "0xratesC", literal: lookback },
      ]);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
    });

    test("chunks N>RATE_BATCH_CHUNK_SIZE: full chunks ride BATCH_RATES_15, tail uses parallel singles", async () => {
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

      const result = await getValidators("sui-graphql-validators-chunked");

      expect(result).toHaveLength(N);
      // 1 system-state + 1 batched + PARTIAL_CHUNK singles.
      expect(query).toHaveBeenCalledTimes(1 + 1 + PARTIAL_CHUNK);
      expect(batchExchangeRateCalls(query)).toHaveLength(1);
      expect(singleRateCalls(query)).toHaveLength(PARTIAL_CHUNK);
      // The single batch carries every variable for the full chunk.
      const batch = batchExchangeRateCalls(query)[0];
      expect(Object.keys(batch[0].variables)).toHaveLength(FULL_CHUNK * 2);
    });

    test("clamps the past epoch to the pool's activation_epoch for young pools", async () => {
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

      await getValidators("sui-graphql-validators-young-pool");

      expect(singleRateVars(query)).toEqual([{ table: "0xratesY", literal: "95u64" }]);
    });

    test("returns [] for an empty active_validators set without a rate fetch", async () => {
      const query = jest.fn().mockResolvedValueOnce(fakeSystemStateQuery("100", []));
      mockNext({ query });

      const result = await getValidators("sui-graphql-validators-empty");

      expect(result).toEqual([]);
      // No rate calls (single or batched) — no validators to plan for.
      expect(singleRateCalls(query)).toHaveLength(0);
      expect(batchExchangeRateCalls(query)).toHaveLength(0);
      expect(query).toHaveBeenCalledTimes(1);
    });

    test("degrades every validator to apy=0 when every rate lookup returns null", async () => {
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

      const result = await getValidators("sui-graphql-validators-all-null-batch");

      expect(result).toHaveLength(3);
      expect(result.map(v => v.apy)).toEqual([0, 0, 0]);
    });
  });
});
