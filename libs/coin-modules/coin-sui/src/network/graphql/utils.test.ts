/**
 * Unit tests for `./utils.ts` — predicates, mappers, and pool exchange-rate math.
 * Pins formulas against JSON-RPC parity and guards against Mysten schema drift.
 */
import { ONE_SUI } from "../../constants";
import { RATE_BATCH_CHUNK_SIZE } from "./constants";
import { BATCH_RATES_15 } from "./queries";
import {
  assertSystemStateJson,
  computeEstimatedReward,
  computeStakeRewards,
  fromSystemStateJson,
  groupStakedSuiByPool,
  isStakedSuiJson,
  parseExchangeRateNode,
  planActivationRateLookups,
  poolRefsFromSystemState,
  shortenCoinType,
  UNKNOWN_VALIDATOR,
  validateStakedSuiNodes,
  type ExchangeRate,
  type ExchangeRateAddrNode,
  type PoolRefs,
  type RatePlan,
  type StakedSuiJson,
  type StakeNode,
} from "./utils";
import { makeSystemStateJson } from "./fixtures";

// ----- shortenCoinType ----------------------------------------------------

describe("shortenCoinType", () => {
  it("should collapse leading zeros for the SUI native coin type", () => {
    expect(
      shortenCoinType(
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
      ),
    ).toBe("0x2::sui::SUI");
  });

  it("should preserve non-zero address prefixes verbatim", () => {
    const ct = "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e::usdc::USDC";
    expect(shortenCoinType(ct)).toBe(ct);
  });

  it("should collapse an all-zero address to 0x0", () => {
    expect(
      shortenCoinType(
        "0x0000000000000000000000000000000000000000000000000000000000000000::null::Null",
      ),
    ).toBe("0x0::null::Null");
  });

  it("should leave an already-short type unchanged (idempotent)", () => {
    expect(shortenCoinType("0x2::sui::SUI")).toBe("0x2::sui::SUI");
  });

  it("should return inputs that don't match the Move type pattern unchanged", () => {
    expect(shortenCoinType("not-a-type")).toBe("not-a-type");
    expect(shortenCoinType("")).toBe("");
  });
});

// ----- isStakedSuiJson ----------------------------------------------------

describe("isStakedSuiJson", () => {
  const validNode: StakedSuiJson = {
    id: "0xstk1",
    pool_id: "0xpool",
    stake_activation_epoch: "100",
    principal: "1000",
  };

  it("should accept a fully-formed StakedSui node", () => {
    expect(isStakedSuiJson(validNode)).toBe(true);
  });

  it("should accept numeric principal and activation_epoch (Move u64 may arrive as JSON number)", () => {
    expect(isStakedSuiJson({ ...validNode, principal: 1000, stake_activation_epoch: 100 })).toBe(
      true,
    );
  });

  // Predicate must filter values BigInt() can't parse; downstream fails closed.
  it.each<[label: string, input: unknown]>([
    ["null root", null],
    ["undefined root", undefined],
    ["string root", "string"],
    ["number root", 42],
    ["boolean root", true],
    ["array root", []],
    ["missing id", { ...validNode, id: undefined }],
    ["non-string id", { ...validNode, id: 42 }],
    ["missing pool_id", { ...validNode, pool_id: undefined }],
    ["non-string pool_id", { ...validNode, pool_id: 42 }],
    ["null principal", { ...validNode, principal: null }],
    ["boolean principal", { ...validNode, principal: true }],
    ["fractional-string principal", { ...validNode, principal: "1.5" }],
    ["negative-string principal", { ...validNode, principal: "-1" }],
    ["alpha-string principal", { ...validNode, principal: "abc" }],
    ["empty-string principal", { ...validNode, principal: "" }],
    ["fractional-string epoch", { ...validNode, stake_activation_epoch: "1.5" }],
    ["alpha-string epoch", { ...validNode, stake_activation_epoch: "abc" }],
    ["negative number principal", { ...validNode, principal: -1 }],
    ["fractional number principal", { ...validNode, principal: 1.5 }],
    ["NaN principal", { ...validNode, principal: NaN }],
    ["negative number epoch", { ...validNode, stake_activation_epoch: -5 }],
  ])("should reject %s", (_label, input) => {
    expect(isStakedSuiJson(input)).toBe(false);
  });

  it("should accept zero (degenerate but valid u64)", () => {
    expect(isStakedSuiJson({ ...validNode, principal: 0 })).toBe(true);
    expect(isStakedSuiJson({ ...validNode, principal: "0" })).toBe(true);
  });
});

// ----- assertSystemStateJson ---------------------------------------------

describe("assertSystemStateJson", () => {
  /** Minimal payload that satisfies the drift guard. */
  const valid = (): unknown => ({
    epoch: 100,
    validators: {
      active_validators: [],
      total_stake: "0",
      pending_active_validators: null,
      pending_removals: null,
      staking_pool_mappings: { id: "0xmap", size: 0 },
      inactive_validators: null,
      validator_candidates: null,
      at_risk_validators: null,
    },
    protocol_version: 1,
    system_state_version: 2,
    reference_gas_price: 100,
    epoch_start_timestamp_ms: 0,
  });

  it("should pass on a minimal valid shape", () => {
    expect(() => assertSystemStateJson(valid())).not.toThrow();
  });

  it.each([null, undefined, "string", 42, []])(
    "should throw on non-object root: %p",
    (input: unknown) => {
      expect(() => assertSystemStateJson(input)).toThrow(/not an object/);
    },
  );

  it("should throw when validators is missing", () => {
    const v = valid() as Record<string, unknown>;
    delete v.validators;
    expect(() => assertSystemStateJson(v)).toThrow(/validators.* not an object/);
  });

  it("should throw when validators is not an object", () => {
    const v = valid() as Record<string, unknown>;
    v.validators = "not-an-object";
    expect(() => assertSystemStateJson(v)).toThrow(/validators.* not an object/);
  });

  it("should throw when active_validators is not an array", () => {
    const v = valid() as { validators: { active_validators: unknown } };
    v.validators.active_validators = { not: "an array" };
    expect(() => assertSystemStateJson(v)).toThrow(/active_validators is not an array/);
  });
});

// ----- fromSystemStateJson + validatorJsonToSummary ---

describe("fromSystemStateJson", () => {
  it("should return empty arrays/maps for an empty active set", () => {
    // GIVEN
    const state = makeSystemStateJson({});

    // WHEN
    const { activeValidators, poolToValidator } = fromSystemStateJson(state);

    // THEN
    expect(activeValidators).toEqual([]);
    expect(poolToValidator.size).toBe(0);
  });

  it("should rename snake_case → camelCase and stringify numeric u64 fields", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [
        {
          poolId: "0xpool1",
          validatorAddress: "0xv1",
          name: "Alice",
          suiBalance: 1_000,
          poolTokenBalance: 900,
          activationEpoch: 50,
        },
      ],
    });

    // WHEN
    const { activeValidators } = fromSystemStateJson(state);

    // THEN
    expect(activeValidators).toHaveLength(1);
    const v = activeValidators[0];
    expect(v.suiAddress).toBe("0xv1");
    expect(v.name).toBe("Alice");
    expect(v.description).toBe("desc");
    expect(v.imageUrl).toBe("https://logo");
    expect(v.projectUrl).toBe("https://project");
    expect(v.commissionRate).toBe("500");
    expect(v.stakingPoolSuiBalance).toBe("1000");
  });

  it("should build pool_id → validator_address map", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [
        { poolId: "0xpoolA", validatorAddress: "0xv1" },
        { poolId: "0xpoolB", validatorAddress: "0xv2" },
      ],
    });

    // WHEN
    const { poolToValidator } = fromSystemStateJson(state);

    // THEN
    expect(poolToValidator.size).toBe(2);
    expect(poolToValidator.get("0xpoolA")).toBe("0xv1");
    expect(poolToValidator.get("0xpoolB")).toBe("0xv2");
  });
});

// ----- groupStakedSuiByPool -----------------------------------------------

describe("groupStakedSuiByPool", () => {
  const stake = (
    id: string,
    pool_id: string,
    activation: string | number,
    principal: string | number = "1000",
  ): StakedSuiJson => ({ id, pool_id, stake_activation_epoch: activation, principal });

  it("should return empty array for empty input", () => {
    // GIVEN / WHEN
    const result = groupStakedSuiByPool([], 100, new Map());

    // THEN
    expect(result).toEqual([]);
  });

  it("should group stakes by pool_id, joining validator address from the pool map", () => {
    // GIVEN
    const pools = new Map([
      ["0xpoolA", "0xvalA"],
      ["0xpoolB", "0xvalB"],
    ]);
    const items = [
      stake("0xs1", "0xpoolA", 50),
      stake("0xs2", "0xpoolA", 60),
      stake("0xs3", "0xpoolB", 70),
    ];

    // WHEN
    const result = groupStakedSuiByPool(items, 100, pools);

    // THEN
    expect(result).toHaveLength(2);
    const a = result.find(g => g.stakingPool === "0xpoolA")!;
    const b = result.find(g => g.stakingPool === "0xpoolB")!;
    expect(a.validatorAddress).toBe("0xvalA");
    expect(b.validatorAddress).toBe("0xvalB");
    expect(a.stakes.map(s => s.stakedSuiId)).toEqual(["0xs1", "0xs2"]);
    expect(b.stakes.map(s => s.stakedSuiId)).toEqual(["0xs3"]);
  });

  it("should fall back to UNKNOWN_VALIDATOR for pools missing from the map (orphan pool)", () => {
    // GIVEN / WHEN
    const result = groupStakedSuiByPool([stake("0xs1", "0xorphan", 50)], 100, new Map());

    // THEN
    expect(result[0].validatorAddress).toBe(UNKNOWN_VALIDATOR);
  });

  it("should compute status: Active when activation_epoch <= currentEpoch, Pending when >", () => {
    // GIVEN
    const items = [stake("0xActive", "0xp", 50), stake("0xPending", "0xp", 200)];
    const pools = new Map([["0xp", "0xv"]]);

    // WHEN
    const result = groupStakedSuiByPool(items, 100, pools);

    // THEN
    const stakes = result[0].stakes;
    const active = stakes.find(s => s.stakedSuiId === "0xActive")!;
    const pending = stakes.find(s => s.stakedSuiId === "0xPending")!;
    expect(active.status).toBe("Active");
    expect(pending.status).toBe("Pending");
  });

  it("should treat activation_epoch === currentEpoch as Active (boundary)", () => {
    // GIVEN / WHEN
    const result = groupStakedSuiByPool([stake("0xs", "0xp", 100)], 100, new Map([["0xp", "0xv"]]));

    // THEN
    expect(result[0].stakes[0].status).toBe("Active");
  });

  it("should derive stakeRequestEpoch as activation - 1 (JSON-RPC convention)", () => {
    // GIVEN / WHEN
    const result = groupStakedSuiByPool([stake("0xs", "0xp", 50)], 100, new Map([["0xp", "0xv"]]));

    // THEN
    expect(result[0].stakes[0].stakeRequestEpoch).toBe("49");
    expect(result[0].stakes[0].stakeActiveEpoch).toBe("50");
  });

  it("should pull estimatedReward from the rewards map for active stakes; missing entries default to '0'", () => {
    // GIVEN
    const rewards = new Map([["0xWithReward", 12345n]]);
    const items = [stake("0xWithReward", "0xp", 50), stake("0xNoReward", "0xp", 50)];

    // WHEN
    const result = groupStakedSuiByPool(items, 100, new Map([["0xp", "0xv"]]), rewards);

    // THEN
    const stakes = result[0].stakes;
    const withReward = stakes.find(s => s.stakedSuiId === "0xWithReward")!;
    const noReward = stakes.find(s => s.stakedSuiId === "0xNoReward")!;
    if (withReward.status !== "Active" || noReward.status !== "Active") {
      throw new Error("expected both Active");
    }
    expect(withReward.estimatedReward).toBe("12345");
    expect(noReward.estimatedReward).toBe("0");
  });

  it("should narrow status so pending stakes have no estimatedReward field", () => {
    // GIVEN / WHEN
    const result = groupStakedSuiByPool(
      [stake("0xpending", "0xp", 200)],
      100,
      new Map([["0xp", "0xv"]]),
    );

    // THEN
    expect(result[0].stakes[0].status).toBe("Pending");
    expect("estimatedReward" in result[0].stakes[0]).toBe(false);
  });
});

// ----- poolRefsFromSystemState --------------------------------------------

describe("poolRefsFromSystemState", () => {
  it("should return empty map for no validators", () => {
    // GIVEN / WHEN
    const refs = poolRefsFromSystemState(makeSystemStateJson({}));

    // THEN
    expect(refs.size).toBe(0);
  });

  it("should populate currentRate from staking_pool sui_balance and pool_token_balance", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [{ poolId: "0xpA", suiBalance: 1_100, poolTokenBalance: 1_000 }],
    });

    // WHEN
    const refs = poolRefsFromSystemState(state);

    // THEN
    expect(refs.get("0xpA")!.currentRate).toEqual({ sui_amount: 1_100, pool_token_amount: 1_000 });
  });

  it("should use exchange_rates.id verbatim", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [{ poolId: "0xpA", exchangeRatesId: "0xratesABC" }],
    });

    // WHEN
    const refs = poolRefsFromSystemState(state);

    // THEN
    expect(refs.get("0xpA")!.exchangeRatesId).toBe("0xratesABC");
  });

  it("should default activationEpoch to 0 when activation_epoch is null", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [{ poolId: "0xpA", activationEpoch: null }],
    });

    // WHEN
    const refs = poolRefsFromSystemState(state);

    // THEN
    expect(refs.get("0xpA")!.activationEpoch).toBe(0);
  });

  it("should convert string activation_epoch to number", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [{ poolId: "0xpA", activationEpoch: "42" }],
    });

    // WHEN
    const refs = poolRefsFromSystemState(state);

    // THEN
    expect(refs.get("0xpA")!.activationEpoch).toBe(42);
  });

  it("should index by pool id (multiple pools)", () => {
    // GIVEN
    const state = makeSystemStateJson({
      validators: [{ poolId: "0xpA" }, { poolId: "0xpB" }],
    });

    // WHEN
    const refs = poolRefsFromSystemState(state);

    // THEN
    expect(refs.size).toBe(2);
    expect(refs.has("0xpA")).toBe(true);
    expect(refs.has("0xpB")).toBe(true);
  });
});

// ----- computeEstimatedReward (pool-token model) --------------------------

describe("computeEstimatedReward", () => {
  it("should return reward = current_value − principal in the steady-state case", () => {
    // GIVEN
    // Pool earned 10% over activation; reward = 110 − 100 = 10.
    const principal = 100n;
    const activationRate = { sui_amount: 1000, pool_token_amount: 1000 };
    const currentRate = { sui_amount: 1100, pool_token_amount: 1000 };

    // WHEN
    const reward = computeEstimatedReward(principal, activationRate, currentRate);

    // THEN
    expect(reward).toBe(10n);
  });

  it("should clamp to zero when current_value < principal (rounding)", () => {
    // GIVEN
    // After rounding, current_value can come out 1 μSUI below principal
    // for very recent stakes. The reward should clamp to 0, not go negative.
    const principal = 100n;
    const activationRate = { sui_amount: 1000, pool_token_amount: 1001 };
    const currentRate = { sui_amount: 1000, pool_token_amount: 1001 };

    // WHEN
    const reward = computeEstimatedReward(principal, activationRate, currentRate);

    // THEN
    expect(reward).toBe(0n);
  });

  it("should return 0 when activation rate has zero sui_amount (degenerate pool)", () => {
    // GIVEN
    const principal = 100n;
    const activationRate = { sui_amount: 0, pool_token_amount: 0 };
    const currentRate = { sui_amount: 100, pool_token_amount: 100 };

    // WHEN
    const reward = computeEstimatedReward(principal, activationRate, currentRate);

    // THEN
    expect(reward).toBe(0n);
  });

  it("should accept string and number principals identically", () => {
    // GIVEN
    const activationRate = { sui_amount: 1000, pool_token_amount: 1000 };
    const currentRate = { sui_amount: 1100, pool_token_amount: 1000 };

    // WHEN
    const fromString = computeEstimatedReward("100", activationRate, currentRate);
    const fromNumber = computeEstimatedReward(100, activationRate, currentRate);

    // THEN
    expect(fromString).toBe(fromNumber);
    expect(fromString).toBe(10n);
  });

  it("should scale correctly for realistic mainnet pool sizes", () => {
    // GIVEN
    // Numbers approximating a real pool (~10M SUI), with ~5% growth.
    const principal = BigInt(ONE_SUI); // 1 SUI principal in MIST
    const activationRate = {
      sui_amount: "10000000000000000",
      pool_token_amount: "9500000000000000",
    }; // sui = 1.0526… pt
    const currentRate = { sui_amount: "10500000000000000", pool_token_amount: "9500000000000000" }; // sui = 1.1053…

    // WHEN
    const reward = computeEstimatedReward(principal, activationRate, currentRate);

    // THEN
    // pool_tokens_owned = 1e9 * 9.5e15 / 10e15 = 9.5e8
    // current_value     = 9.5e8 * 1.05e16 / 9.5e15 = 1.05e9
    // reward            = 5e7
    expect(reward).toBe(50_000_000n);
  });
});

// ----- validateStakedSuiNodes ---------------------------------------------

describe("validateStakedSuiNodes", () => {
  /** Convenience: wrap a `MoveValue.json` payload as the GraphQL StakeNode shape. */
  const node = (json: unknown): StakeNode => ({ contents: { json } }) as unknown as StakeNode;
  const validJson = (id: string): StakedSuiJson => ({
    id,
    pool_id: "0xpool",
    stake_activation_epoch: "100",
    principal: "1000",
  });

  it("should return empty arrays/zero malformed for empty input", () => {
    // GIVEN / WHEN
    const result = validateStakedSuiNodes([]);

    // THEN
    expect(result).toEqual({ items: [], malformed: 0 });
  });

  it("should collect well-formed nodes; malformed stays 0", () => {
    // GIVEN
    const nodes = [node(validJson("0xs1")), node(validJson("0xs2"))];

    // WHEN
    const { items, malformed } = validateStakedSuiNodes(nodes);

    // THEN
    expect(items.map(i => i.id)).toEqual(["0xs1", "0xs2"]);
    expect(malformed).toBe(0);
  });

  it("should count malformed payloads (e.g. missing pool_id) as skipped", () => {
    // GIVEN
    const nodes = [
      node(validJson("0xs1")),
      node({ id: "0xs2", stake_activation_epoch: "100", principal: "1000" }), // no pool_id
    ];

    // WHEN
    const { items, malformed } = validateStakedSuiNodes(nodes);

    // THEN
    expect(items.map(i => i.id)).toEqual(["0xs1"]);
    expect(malformed).toBe(1);
  });

  it("should ignore null/undefined contents without incrementing malformed", () => {
    // GIVEN
    // Reflects an actual GraphQL response shape: `contents` may be absent
    // when the indexer hasn't materialised the Move object yet.
    const empty = { contents: { json: null } } as unknown as StakeNode;
    const undef = { contents: { json: undefined } } as unknown as StakeNode;
    const noContents = {} as unknown as StakeNode;

    // WHEN
    const { items, malformed } = validateStakedSuiNodes([empty, undef, noContents]);

    // THEN
    expect(items).toEqual([]);
    expect(malformed).toBe(0);
  });
});

// ----- planActivationRateLookups -----------------------------------------

describe("planActivationRateLookups", () => {
  const refs = (id: string, ratesId: string, activationEpoch = 0): [string, PoolRefs] => [
    id,
    {
      exchangeRatesId: ratesId,
      currentRate: { sui_amount: 1, pool_token_amount: 1 },
      activationEpoch,
    },
  ];

  it("should exclude Pending stakes (activation > currentEpoch) from activeStakes", () => {
    // GIVEN
    const items: StakedSuiJson[] = [
      { id: "0xActive", pool_id: "0xp", stake_activation_epoch: 50, principal: "100" },
      { id: "0xPending", pool_id: "0xp", stake_activation_epoch: 200, principal: "100" },
    ];
    const poolRefs = new Map([refs("0xp", "0xrates")]);

    // WHEN
    const { activeStakes } = planActivationRateLookups(items, 100n, poolRefs);

    // THEN
    expect(activeStakes.map(p => p.stakedSuiId)).toEqual(["0xActive"]);
  });

  it("should treat activation == currentEpoch as Active (boundary)", () => {
    // GIVEN
    const items: StakedSuiJson[] = [
      { id: "0xs", pool_id: "0xp", stake_activation_epoch: 100, principal: "1" },
    ];
    const poolRefs = new Map([refs("0xp", "0xrates")]);

    // WHEN
    const { activeStakes } = planActivationRateLookups(items, 100n, poolRefs);

    // THEN
    expect(activeStakes).toHaveLength(1);
  });

  it("should dedupe (table, epoch) so two stakes in the same pool/epoch yield one wantedEntry", () => {
    // GIVEN
    const items: StakedSuiJson[] = [
      { id: "0xs1", pool_id: "0xp", stake_activation_epoch: 50, principal: "100" },
      { id: "0xs2", pool_id: "0xp", stake_activation_epoch: 50, principal: "200" },
    ];
    const poolRefs = new Map([refs("0xp", "0xrates")]);

    // WHEN
    const { wantedEntries } = planActivationRateLookups(items, 100n, poolRefs);

    // THEN
    expect(wantedEntries).toHaveLength(1);
    expect(wantedEntries[0].table).toBe("0xrates");
    expect(wantedEntries[0].epoch).toBe(50);
  });

  it("should emit one wantedEntry per distinct (table, epoch) pair", () => {
    // GIVEN
    const items: StakedSuiJson[] = [
      { id: "0xs1", pool_id: "0xpA", stake_activation_epoch: 50, principal: "1" },
      { id: "0xs2", pool_id: "0xpA", stake_activation_epoch: 60, principal: "1" }, // same table, new epoch
      { id: "0xs3", pool_id: "0xpB", stake_activation_epoch: 50, principal: "1" }, // new table, same epoch
    ];
    const poolRefs = new Map([refs("0xpA", "0xratesA"), refs("0xpB", "0xratesB")]);

    // WHEN
    const { wantedEntries } = planActivationRateLookups(items, 100n, poolRefs);

    // THEN
    expect(wantedEntries).toHaveLength(3);
  });

  it("should drop orphan-pool stakes from wantedEntries; activeStakes still includes them", () => {
    // GIVEN
    // activeStakes mirrors what `groupStakedSuiByPool` will iterate;
    // orphans stay in the list with reward "0" (no rate to look up).
    const items: StakedSuiJson[] = [
      { id: "0xs", pool_id: "0xorphan", stake_activation_epoch: 50, principal: "100" },
    ];

    // WHEN
    const { activeStakes, wantedEntries } = planActivationRateLookups(items, 100n, new Map());

    // THEN
    expect(activeStakes).toHaveLength(1);
    expect(wantedEntries).toHaveLength(0);
  });
});

// ----- computeStakeRewards ------------------------------------------------

describe("computeStakeRewards", () => {
  const plan = (
    stakedSuiId: string,
    poolId: string,
    activationEpoch: string | number,
  ): RatePlan => ({
    stakedSuiId,
    principal: "100",
    poolId,
    activationEpoch,
  });
  const poolRef = (ratesId: string): PoolRefs => ({
    exchangeRatesId: ratesId,
    // 1 SUI = 1.1 pool tokens — current rate represents 10% pool growth.
    currentRate: { sui_amount: 1100, pool_token_amount: 1000 },
    activationEpoch: 0,
  });

  it("should compute the pool-token reward for a stake whose rate is present", () => {
    // GIVEN
    // Activation rate: 1 SUI = 1 pool token. Reward = 110 − 100 = 10.
    const plans = [plan("0xs", "0xp", 50)];
    const poolRefs = new Map([["0xp", poolRef("0xrates")]]);
    const rates = new Map([["0xrates@50", { sui_amount: 1000, pool_token_amount: 1000 }]]);

    // WHEN
    const rewards = computeStakeRewards(plans, poolRefs, rates);

    // THEN
    expect(rewards.get("0xs")).toBe(10n);
  });

  it("should skip stakes whose rate is null (entry absent → caller defaults to '0')", () => {
    // GIVEN
    const plans = [plan("0xs", "0xp", 50)];
    const poolRefs = new Map([["0xp", poolRef("0xrates")]]);
    const rates = new Map<string, ExchangeRate | null>([["0xrates@50", null]]);

    // WHEN
    const rewards = computeStakeRewards(plans, poolRefs, rates);

    // THEN
    expect(rewards.has("0xs")).toBe(false);
  });

  it("should skip stakes whose rate key is missing entirely", () => {
    // GIVEN
    const plans = [plan("0xs", "0xp", 50)];
    const poolRefs = new Map([["0xp", poolRef("0xrates")]]);

    // WHEN
    const rewards = computeStakeRewards(plans, poolRefs, new Map());

    // THEN
    expect(rewards.has("0xs")).toBe(false);
  });

  it("should skip orphan-pool stakes (no PoolRefs entry)", () => {
    // GIVEN
    const plans = [plan("0xs", "0xorphan", 50)];

    // WHEN
    const rewards = computeStakeRewards(plans, new Map(), new Map());

    // THEN
    expect(rewards.size).toBe(0);
  });
});

// ----- parseExchangeRateNode ----------------------------------------------

describe("parseExchangeRateNode", () => {
  it("should extract a valid ExchangeRate from a MoveValue dynamicField", () => {
    // GIVEN
    const node: ExchangeRateAddrNode = {
      dynamicField: {
        value: { __typename: "MoveValue", json: { sui_amount: "1100", pool_token_amount: "1000" } },
      },
    };

    // WHEN
    const result = parseExchangeRateNode(node);

    // THEN
    expect(result).toEqual({ sui_amount: "1100", pool_token_amount: "1000" });
  });

  it("should return null for a null root (no address)", () => {
    expect(parseExchangeRateNode(null)).toBeNull();
  });

  it("should return null when dynamicField is absent", () => {
    expect(parseExchangeRateNode({ dynamicField: null })).toBeNull();
    expect(parseExchangeRateNode({})).toBeNull();
  });

  it("should return null when value typename is not MoveValue (union mismatch)", () => {
    // GIVEN
    const node: ExchangeRateAddrNode = {
      dynamicField: {
        value: { __typename: "MoveObject", json: { sui_amount: 1, pool_token_amount: 1 } },
      },
    };

    // WHEN / THEN
    expect(parseExchangeRateNode(node)).toBeNull();
  });

  it("should return null when json fails the ExchangeRate predicate", () => {
    // GIVEN
    // Wrong field names — schema-drift simulation.
    const node: ExchangeRateAddrNode = {
      dynamicField: {
        value: { __typename: "MoveValue", json: { sui: 1, pool_tokens: 1 } },
      },
    };

    // WHEN / THEN
    expect(parseExchangeRateNode(node)).toBeNull();
  });

  // Schema-drift safety: malformed numerics → null, not a thrown sync.
  const malformedRate = (sui: unknown, pt: unknown): ExchangeRateAddrNode => ({
    dynamicField: {
      value: { __typename: "MoveValue", json: { sui_amount: sui, pool_token_amount: pt } },
    },
  });
  it.each<[label: string, sui: unknown, pt: unknown]>([
    ["fractional-string sui", "1.5", "1000"],
    ["alpha-string pt", "1000", "abc"],
    ["negative-string sui", "-1", "1000"],
    ["fractional-number sui", 1.5, 1000],
    ["negative-number sui", -1, 1000],
    ["empty-string sui", "", "1000"],
  ])("should return null on %s (would crash BigInt() downstream)", (_label, sui, pt) => {
    expect(parseExchangeRateNode(malformedRate(sui, pt))).toBeNull();
  });
});

// ----- BATCH_RATES_15 structural invariant --------------------------------

describe("BATCH_RATES_15 structural invariant", () => {
  it("should keep alias count in lock-step with RATE_BATCH_CHUNK_SIZE", () => {
    // GIVEN
    // Guards the comment-only contract in `queries.ts`: `fetchRateChunk`
    // builds a variable map of size RATE_BATCH_CHUNK_SIZE and the document
    // must have exactly that many `vN:` aliases or the server rejects the
    // request shape (caller-side TS can't see this, see `@ts-expect-error`).
    const op = (BATCH_RATES_15 as { definitions: ReadonlyArray<unknown> }).definitions[0] as {
      kind?: string;
      selectionSet?: { selections: ReadonlyArray<{ kind: string; alias?: { value: string } }> };
    };

    // WHEN
    const aliases =
      op.selectionSet?.selections.filter(
        s => s.kind === "Field" && /^v\d+$/.test(s.alias?.value ?? ""),
      ).length ?? 0;

    // THEN
    expect(op.kind).toBe("OperationDefinition");
    expect(aliases).toBe(RATE_BATCH_CHUNK_SIZE);
  });
});
