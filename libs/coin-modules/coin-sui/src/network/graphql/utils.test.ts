/**
 * Tests for the GraphQL pure-helpers in `./utils.ts`: drift guards, type
 * predicates, snake_case → camelCase mappers, and the pool exchange-rate
 * math (per-stake reward + per-validator APY). Unit coverage here pins
 * formulas against JSON-RPC parity and protects against schema drift on
 * the Mysten side without a full `getStakesRaw` / `getValidators` integ.
 */
import { ONE_SUI } from "../../constants";
import { RATE_BATCH_CHUNK_SIZE } from "./constants";
import { BATCH_RATES_15 } from "./queries";
import {
  assertSystemStateJson,
  computeApy,
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
  type SuiSystemStateInnerJson,
} from "./utils";

// ----- shortenCoinType ----------------------------------------------------

describe("shortenCoinType", () => {
  test("collapses leading zeros for the SUI native coin type", () => {
    expect(
      shortenCoinType(
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
      ),
    ).toBe("0x2::sui::SUI");
  });

  test("preserves non-zero address prefixes verbatim", () => {
    const ct = "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e::usdc::USDC";
    expect(shortenCoinType(ct)).toBe(ct);
  });

  test("collapses an all-zero address to 0x0", () => {
    expect(
      shortenCoinType(
        "0x0000000000000000000000000000000000000000000000000000000000000000::null::Null",
      ),
    ).toBe("0x0::null::Null");
  });

  test("leaves an already-short type unchanged (idempotent)", () => {
    expect(shortenCoinType("0x2::sui::SUI")).toBe("0x2::sui::SUI");
  });

  test("returns inputs that don't match the Move type pattern unchanged", () => {
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

  test("accepts a fully-formed StakedSui node", () => {
    expect(isStakedSuiJson(validNode)).toBe(true);
  });

  test("accepts numeric principal and activation_epoch (Move u64 may arrive as JSON number)", () => {
    expect(isStakedSuiJson({ ...validNode, principal: 1000, stake_activation_epoch: 100 })).toBe(
      true,
    );
  });

  test.each([null, undefined, "string", 42, true, []])(
    "rejects non-object input: %p",
    (input: unknown) => {
      expect(isStakedSuiJson(input)).toBe(false);
    },
  );

  test("rejects when id is missing or non-string", () => {
    expect(isStakedSuiJson({ ...validNode, id: undefined })).toBe(false);
    expect(isStakedSuiJson({ ...validNode, id: 42 })).toBe(false);
  });

  test("rejects when pool_id is missing or non-string", () => {
    expect(isStakedSuiJson({ ...validNode, pool_id: undefined })).toBe(false);
    expect(isStakedSuiJson({ ...validNode, pool_id: 42 })).toBe(false);
  });

  test("rejects when principal is neither string nor number", () => {
    expect(isStakedSuiJson({ ...validNode, principal: null })).toBe(false);
    expect(isStakedSuiJson({ ...validNode, principal: true })).toBe(false);
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

  test("passes on a minimal valid shape", () => {
    expect(() => assertSystemStateJson(valid())).not.toThrow();
  });

  test.each([null, undefined, "string", 42, []])(
    "throws on non-object root: %p",
    (input: unknown) => {
      expect(() => assertSystemStateJson(input)).toThrow(/not an object/);
    },
  );

  test("throws when validators is missing", () => {
    const v = valid() as Record<string, unknown>;
    delete v.validators;
    expect(() => assertSystemStateJson(v)).toThrow(/validators.* not an object/);
  });

  test("throws when validators is not an object", () => {
    const v = valid() as Record<string, unknown>;
    v.validators = "not-an-object";
    expect(() => assertSystemStateJson(v)).toThrow(/validators.* not an object/);
  });

  test("throws when active_validators is not an array", () => {
    const v = valid() as { validators: { active_validators: unknown } };
    v.validators.active_validators = { not: "an array" };
    expect(() => assertSystemStateJson(v)).toThrow(/active_validators is not an array/);
  });
});

// ----- fromSystemStateJson + validatorJsonToSummary (via fromSystemStateJson) ---

describe("fromSystemStateJson", () => {
  /** One fully-populated active validator entry — all fields the mapper reads. */
  function makeValidator(suiAddress: string, poolId: string, name = "V") {
    return {
      metadata: {
        sui_address: suiAddress,
        protocol_pubkey_bytes: "0xpk",
        network_pubkey_bytes: "0xnk",
        worker_pubkey_bytes: "0xwk",
        proof_of_possession: "0xpp",
        name,
        description: "desc",
        image_url: "https://logo",
        project_url: "https://project",
        net_address: "/ip4/1.2.3.4",
        p2p_address: "/ip4/1.2.3.5",
        primary_address: "/ip4/1.2.3.6",
        worker_address: "/ip4/1.2.3.7",
        next_epoch_protocol_pubkey_bytes: null,
        next_epoch_proof_of_possession: null,
        next_epoch_network_pubkey_bytes: null,
        next_epoch_worker_pubkey_bytes: null,
        next_epoch_net_address: null,
        next_epoch_p2p_address: null,
        next_epoch_primary_address: null,
        next_epoch_worker_address: null,
      },
      voting_power: 100,
      operation_cap_id: "0xcap",
      gas_price: 800,
      staking_pool: {
        id: poolId,
        activation_epoch: 50,
        deactivation_epoch: null,
        sui_balance: 1_000,
        rewards_pool: 50,
        pool_token_balance: 900,
        exchange_rates: { id: "0xrates", size: 100 },
        pending_stake: 0,
        pending_total_sui_withdraw: 0,
        pending_pool_token_withdraw: 0,
      },
      commission_rate: 500,
      next_epoch_stake: 1_000,
      next_epoch_gas_price: 800,
      next_epoch_commission_rate: 500,
    };
  }

  function makeState(active: ReturnType<typeof makeValidator>[]): SuiSystemStateInnerJson {
    return {
      epoch: 100,
      protocol_version: 1,
      system_state_version: 2,
      validators: {
        active_validators: active,
        total_stake: "0",
        pending_active_validators: null,
        pending_removals: null,
        staking_pool_mappings: { id: "0xmap", size: active.length },
        inactive_validators: null,
        validator_candidates: null,
        at_risk_validators: null,
      },
      reference_gas_price: 100,
      epoch_start_timestamp_ms: 0,
    };
  }

  test("returns empty arrays/maps for an empty active set", () => {
    const { activeValidators, poolToValidator } = fromSystemStateJson(makeState([]));
    expect(activeValidators).toEqual([]);
    expect(poolToValidator.size).toBe(0);
  });

  test("renames snake_case → camelCase and stringifies numeric u64 fields", () => {
    const state = makeState([makeValidator("0xv1", "0xpool1", "Alice")]);
    const { activeValidators } = fromSystemStateJson(state);

    expect(activeValidators).toHaveLength(1);
    const v = activeValidators[0];
    expect(v.suiAddress).toBe("0xv1");
    expect(v.name).toBe("Alice");
    expect(v.imageUrl).toBe("https://logo");
    expect(v.projectUrl).toBe("https://project");
    expect(v.protocolPubkeyBytes).toBe("0xpk");
    expect(v.networkPubkeyBytes).toBe("0xnk");
    expect(v.workerPubkeyBytes).toBe("0xwk");
    expect(v.proofOfPossessionBytes).toBe("0xpp");
    expect(v.netAddress).toBe("/ip4/1.2.3.4");
    expect(v.operationCapId).toBe("0xcap");
    // numeric → string
    expect(v.votingPower).toBe("100");
    expect(v.gasPrice).toBe("800");
    expect(v.commissionRate).toBe("500");
    expect(v.nextEpochStake).toBe("1000");
    // pool fields
    expect(v.stakingPoolId).toBe("0xpool1");
    expect(v.stakingPoolActivationEpoch).toBe("50");
    expect(v.stakingPoolDeactivationEpoch).toBeNull();
    expect(v.stakingPoolSuiBalance).toBe("1000");
    expect(v.exchangeRatesId).toBe("0xrates");
    expect(v.exchangeRatesSize).toBe("100");
  });

  test("preserves nullable next-epoch fields as null (not undefined)", () => {
    const state = makeState([makeValidator("0xv1", "0xpool1")]);
    const v = fromSystemStateJson(state).activeValidators[0];
    expect(v.nextEpochProtocolPubkeyBytes).toBeNull();
    expect(v.nextEpochNetAddress).toBeNull();
    expect(v.nextEpochP2pAddress).toBeNull();
    expect(v.nextEpochWorkerAddress).toBeNull();
  });

  test("builds pool_id → validator_address map", () => {
    const state = makeState([makeValidator("0xv1", "0xpoolA"), makeValidator("0xv2", "0xpoolB")]);
    const { poolToValidator } = fromSystemStateJson(state);
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

  test("returns empty array for empty input", () => {
    expect(groupStakedSuiByPool([], 100, new Map())).toEqual([]);
  });

  test("groups stakes by pool_id, joining validator address from the pool map", () => {
    const pools = new Map([
      ["0xpoolA", "0xvalA"],
      ["0xpoolB", "0xvalB"],
    ]);
    const result = groupStakedSuiByPool(
      [stake("0xs1", "0xpoolA", 50), stake("0xs2", "0xpoolA", 60), stake("0xs3", "0xpoolB", 70)],
      100,
      pools,
    );
    expect(result).toHaveLength(2);
    const a = result.find(g => g.stakingPool === "0xpoolA")!;
    const b = result.find(g => g.stakingPool === "0xpoolB")!;
    expect(a.validatorAddress).toBe("0xvalA");
    expect(b.validatorAddress).toBe("0xvalB");
    expect(a.stakes.map(s => s.stakedSuiId)).toEqual(["0xs1", "0xs2"]);
    expect(b.stakes.map(s => s.stakedSuiId)).toEqual(["0xs3"]);
  });

  test("falls back to UNKNOWN_VALIDATOR for pools missing from the map (orphan pool)", () => {
    const result = groupStakedSuiByPool([stake("0xs1", "0xorphan", 50)], 100, new Map());
    expect(result[0].validatorAddress).toBe(UNKNOWN_VALIDATOR);
  });

  test("computes status: active when activation_epoch <= currentEpoch, pending when >", () => {
    const result = groupStakedSuiByPool(
      [stake("0xActive", "0xp", 50), stake("0xPending", "0xp", 200)],
      100,
      new Map([["0xp", "0xv"]]),
    );
    const stakes = result[0].stakes;
    const active = stakes.find(s => s.stakedSuiId === "0xActive")!;
    const pending = stakes.find(s => s.stakedSuiId === "0xPending")!;
    expect(active.status).toBe("Active");
    expect(pending.status).toBe("Pending");
  });

  test("treats activation_epoch === currentEpoch as Active (boundary)", () => {
    const result = groupStakedSuiByPool([stake("0xs", "0xp", 100)], 100, new Map([["0xp", "0xv"]]));
    expect(result[0].stakes[0].status).toBe("Active");
  });

  test("derives stakeRequestEpoch as activation - 1 (JSON-RPC convention)", () => {
    const result = groupStakedSuiByPool([stake("0xs", "0xp", 50)], 100, new Map([["0xp", "0xv"]]));
    expect(result[0].stakes[0].stakeRequestEpoch).toBe("49");
    expect(result[0].stakes[0].stakeActiveEpoch).toBe("50");
  });

  test("active stakes pull estimatedReward from the rewards map; missing entries default to '0'", () => {
    const rewards = new Map([["0xWithReward", 12345n]]);
    const result = groupStakedSuiByPool(
      [stake("0xWithReward", "0xp", 50), stake("0xNoReward", "0xp", 50)],
      100,
      new Map([["0xp", "0xv"]]),
      rewards,
    );
    const stakes = result[0].stakes;
    const withReward = stakes.find(s => s.stakedSuiId === "0xWithReward")!;
    const noReward = stakes.find(s => s.stakedSuiId === "0xNoReward")!;
    if (withReward.status !== "Active" || noReward.status !== "Active") {
      throw new Error("expected both Active");
    }
    expect(withReward.estimatedReward).toBe("12345");
    expect(noReward.estimatedReward).toBe("0");
  });

  test("pending stakes have no estimatedReward field (status-narrowed)", () => {
    const result = groupStakedSuiByPool(
      [stake("0xpending", "0xp", 200)],
      100,
      new Map([["0xp", "0xv"]]),
    );
    expect(result[0].stakes[0].status).toBe("Pending");
    expect("estimatedReward" in result[0].stakes[0]).toBe(false);
  });
});

// ----- poolRefsFromSystemState --------------------------------------------

describe("poolRefsFromSystemState", () => {
  /** Tiny system-state with N pools, varying sui/pool_token balances. */
  function stateWithPools(
    pools: Array<{
      poolId: string;
      sui: string | number;
      pt: string | number;
      activation?: string | number | null;
      ratesId?: string;
    }>,
  ): SuiSystemStateInnerJson {
    return {
      epoch: 100,
      protocol_version: 1,
      system_state_version: 2,
      validators: {
        active_validators: pools.map(p => ({
          metadata: {
            sui_address: "0xv",
            protocol_pubkey_bytes: "",
            network_pubkey_bytes: "",
            worker_pubkey_bytes: "",
            proof_of_possession: "",
            name: "V",
            description: "",
            image_url: "",
            project_url: "",
            net_address: "",
            p2p_address: "",
            primary_address: "",
            worker_address: "",
          },
          voting_power: 0,
          operation_cap_id: "0xcap",
          gas_price: 0,
          staking_pool: {
            id: p.poolId,
            activation_epoch: p.activation === undefined ? 0 : p.activation,
            deactivation_epoch: null,
            sui_balance: p.sui,
            rewards_pool: 0,
            pool_token_balance: p.pt,
            exchange_rates: { id: p.ratesId ?? "0xrates", size: 0 },
            pending_stake: 0,
            pending_total_sui_withdraw: 0,
            pending_pool_token_withdraw: 0,
          },
          commission_rate: 0,
          next_epoch_stake: 0,
          next_epoch_gas_price: 0,
          next_epoch_commission_rate: 0,
        })),
        total_stake: "0",
        pending_active_validators: null,
        pending_removals: null,
        staking_pool_mappings: { id: "0xmap", size: pools.length },
        inactive_validators: null,
        validator_candidates: null,
        at_risk_validators: null,
      },
      reference_gas_price: 0,
      epoch_start_timestamp_ms: 0,
    };
  }

  test("returns empty map for no validators", () => {
    expect(poolRefsFromSystemState(stateWithPools([])).size).toBe(0);
  });

  test("populates currentRate from staking_pool sui_balance and pool_token_balance", () => {
    const refs = poolRefsFromSystemState(
      stateWithPools([{ poolId: "0xpA", sui: 1_100, pt: 1_000 }]),
    );
    const a = refs.get("0xpA")!;
    expect(a.currentRate).toEqual({ sui_amount: 1_100, pool_token_amount: 1_000 });
  });

  test("uses exchange_rates.id verbatim", () => {
    const refs = poolRefsFromSystemState(
      stateWithPools([{ poolId: "0xpA", sui: 1, pt: 1, ratesId: "0xratesABC" }]),
    );
    expect(refs.get("0xpA")!.exchangeRatesId).toBe("0xratesABC");
  });

  test("activationEpoch defaults to 0 when activation_epoch is null", () => {
    const refs = poolRefsFromSystemState(
      stateWithPools([{ poolId: "0xpA", sui: 1, pt: 1, activation: null }]),
    );
    expect(refs.get("0xpA")!.activationEpoch).toBe(0);
  });

  test("converts string activation_epoch to number", () => {
    const refs = poolRefsFromSystemState(
      stateWithPools([{ poolId: "0xpA", sui: 1, pt: 1, activation: "42" }]),
    );
    expect(refs.get("0xpA")!.activationEpoch).toBe(42);
  });

  test("indexes by pool id (multiple pools)", () => {
    const refs = poolRefsFromSystemState(
      stateWithPools([
        { poolId: "0xpA", sui: 1, pt: 1 },
        { poolId: "0xpB", sui: 2, pt: 2 },
      ]),
    );
    expect(refs.size).toBe(2);
    expect(refs.has("0xpA")).toBe(true);
    expect(refs.has("0xpB")).toBe(true);
  });
});

// ----- computeEstimatedReward (pool-token model) --------------------------

describe("computeEstimatedReward", () => {
  test("returns reward = current_value − principal in the steady-state case", () => {
    // Activation rate: 1 SUI = 1 pool token (sui:1000, pt:1000)
    // Current rate:    1 SUI = 1.1 pool tokens — pool earned 10% rewards
    //                          since activation (sui:1100 with pt unchanged).
    // 100 SUI staked → 100 * 1000/1000 = 100 pool tokens
    // current_value = 100 * 1100/1000 = 110 SUI
    // reward = 110 − 100 = 10
    const reward = computeEstimatedReward(
      100n,
      { sui_amount: 1000, pool_token_amount: 1000 },
      { sui_amount: 1100, pool_token_amount: 1000 },
    );
    expect(reward).toBe(10n);
  });

  test("clamps to zero when current_value < principal (rounding)", () => {
    // After rounding, current_value can come out 1 μSUI below principal
    // for very recent stakes. The reward should clamp to 0, not be
    // a negative bigint.
    const reward = computeEstimatedReward(
      100n,
      { sui_amount: 1000, pool_token_amount: 1001 },
      { sui_amount: 1000, pool_token_amount: 1001 },
    );
    expect(reward).toBe(0n);
  });

  test("returns 0 when activation rate has zero sui_amount (degenerate pool)", () => {
    const reward = computeEstimatedReward(
      100n,
      { sui_amount: 0, pool_token_amount: 0 },
      { sui_amount: 100, pool_token_amount: 100 },
    );
    expect(reward).toBe(0n);
  });

  test("accepts string and number principals identically", () => {
    const fromString = computeEstimatedReward(
      "100",
      { sui_amount: 1000, pool_token_amount: 1000 },
      { sui_amount: 1100, pool_token_amount: 1000 },
    );
    const fromNumber = computeEstimatedReward(
      100,
      { sui_amount: 1000, pool_token_amount: 1000 },
      { sui_amount: 1100, pool_token_amount: 1000 },
    );
    expect(fromString).toBe(fromNumber);
    expect(fromString).toBe(10n);
  });

  test("scales correctly for realistic mainnet pool sizes", () => {
    // Numbers approximating a real pool (~10M SUI), with ~5% growth.
    const reward = computeEstimatedReward(
      BigInt(ONE_SUI), // 1 SUI principal in MIST
      { sui_amount: "10000000000000000", pool_token_amount: "9500000000000000" }, // sui = 1.0526… pt
      { sui_amount: "10500000000000000", pool_token_amount: "9500000000000000" }, // sui = 1.1053…
    );
    // pool_tokens_owned = 1e9 * 9.5e15 / 10e15 = 9.5e8
    // current_value     = 9.5e8 * 1.05e16 / 9.5e15 = 1.05e9
    // reward            = 5e7
    expect(reward).toBe(50_000_000n);
  });
});

// ----- computeApy ---------------------------------------------------------

describe("computeApy", () => {
  test("computes annualised growth from a 30-epoch window", () => {
    // Past rate: ratio = 1.0 (sui:1000, pt:1000).
    // Now:       ratio = 1.01 (sui:1010, pt:1000) — 1% growth over 30 epochs.
    // per-epoch growth = 1.01^(1/30)
    // APY              = (1.01^(1/30))^365 − 1 = 1.01^(365/30) − 1 ≈ 0.1295
    const apy = computeApy(
      { sui_amount: 1010, pool_token_amount: 1000 },
      { sui_amount: 1000, pool_token_amount: 1000 },
      30,
    );
    expect(apy).toBeGreaterThan(0.12);
    expect(apy).toBeLessThan(0.14);
  });

  test("returns 0 when current_ratio == past_ratio (no growth)", () => {
    const apy = computeApy(
      { sui_amount: 1000, pool_token_amount: 1000 },
      { sui_amount: 1000, pool_token_amount: 1000 },
      30,
    );
    expect(apy).toBe(0);
  });

  test("clamps negative growth to 0", () => {
    // Past rate higher than current — pool effectively bled value.
    // Real wallets shouldn't show a negative APY; clamp to 0.
    const apy = computeApy(
      { sui_amount: 990, pool_token_amount: 1000 },
      { sui_amount: 1000, pool_token_amount: 1000 },
      30,
    );
    expect(apy).toBe(0);
  });

  test("returns 0 for non-positive epochsBetween", () => {
    expect(
      computeApy(
        { sui_amount: 1010, pool_token_amount: 1000 },
        { sui_amount: 1000, pool_token_amount: 1000 },
        0,
      ),
    ).toBe(0);
    expect(
      computeApy(
        { sui_amount: 1010, pool_token_amount: 1000 },
        { sui_amount: 1000, pool_token_amount: 1000 },
        -5,
      ),
    ).toBe(0);
  });

  test("returns 0 when past rate has zero pool_token_amount (degenerate)", () => {
    const apy = computeApy(
      { sui_amount: 1010, pool_token_amount: 1000 },
      { sui_amount: 1000, pool_token_amount: 0 },
      30,
    );
    expect(apy).toBe(0);
  });

  test("matches known JSON-RPC values within tolerance for a realistic pool", () => {
    // Approximate n1stake-like pool: ~10M SUI, ~3% over 30 epochs.
    // Real on-chain APY for SUI mainnet validators usually sits in 2-4%.
    // 3% growth over 30 days → APY ≈ (1.03)^(365/30) − 1 ≈ 0.4332 (43%)
    // — except SUI compounds DAILY, so per-epoch is small. The test here
    // uses 0.3% growth over 30 epochs, which annualises to ~3.7%.
    const apy = computeApy(
      { sui_amount: "10030000000000000", pool_token_amount: "10000000000000000" },
      { sui_amount: "10000000000000000", pool_token_amount: "10000000000000000" },
      30,
    );
    expect(apy).toBeGreaterThan(0.03);
    expect(apy).toBeLessThan(0.04);
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

  test("returns empty arrays/zero malformed for empty input", () => {
    expect(validateStakedSuiNodes([])).toEqual({ items: [], malformed: 0 });
  });

  test("collects well-formed nodes; malformed stays 0", () => {
    const { items, malformed } = validateStakedSuiNodes([
      node(validJson("0xs1")),
      node(validJson("0xs2")),
    ]);
    expect(items.map(i => i.id)).toEqual(["0xs1", "0xs2"]);
    expect(malformed).toBe(0);
  });

  test("counts malformed payloads (e.g. missing pool_id) as skipped", () => {
    const { items, malformed } = validateStakedSuiNodes([
      node(validJson("0xs1")),
      node({ id: "0xs2", stake_activation_epoch: "100", principal: "1000" }), // no pool_id
    ]);
    expect(items.map(i => i.id)).toEqual(["0xs1"]);
    expect(malformed).toBe(1);
  });

  test("ignores null/undefined contents without incrementing malformed", () => {
    // Reflects an actual GraphQL response shape: `contents` may be absent
    // when the indexer hasn't materialised the Move object yet.
    const empty = { contents: { json: null } } as unknown as StakeNode;
    const undef = { contents: { json: undefined } } as unknown as StakeNode;
    const noContents = {} as unknown as StakeNode;
    const { items, malformed } = validateStakedSuiNodes([empty, undef, noContents]);
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

  test("excludes Pending stakes (activation > currentEpoch) from activeStakes", () => {
    const items: StakedSuiJson[] = [
      { id: "0xActive", pool_id: "0xp", stake_activation_epoch: 50, principal: "100" },
      { id: "0xPending", pool_id: "0xp", stake_activation_epoch: 200, principal: "100" },
    ];
    const { activeStakes } = planActivationRateLookups(
      items,
      100n,
      new Map([refs("0xp", "0xrates")]),
    );
    expect(activeStakes.map(p => p.stakedSuiId)).toEqual(["0xActive"]);
  });

  test("treats activation == currentEpoch as Active (boundary)", () => {
    const items: StakedSuiJson[] = [
      { id: "0xs", pool_id: "0xp", stake_activation_epoch: 100, principal: "1" },
    ];
    const { activeStakes } = planActivationRateLookups(
      items,
      100n,
      new Map([refs("0xp", "0xrates")]),
    );
    expect(activeStakes).toHaveLength(1);
  });

  test("dedupes (table, epoch) so two stakes in the same pool/epoch yield one wantedEntry", () => {
    const items: StakedSuiJson[] = [
      { id: "0xs1", pool_id: "0xp", stake_activation_epoch: 50, principal: "100" },
      { id: "0xs2", pool_id: "0xp", stake_activation_epoch: 50, principal: "200" },
    ];
    const { wantedEntries } = planActivationRateLookups(
      items,
      100n,
      new Map([refs("0xp", "0xrates")]),
    );
    expect(wantedEntries).toHaveLength(1);
    expect(wantedEntries[0].table).toBe("0xrates");
    expect(wantedEntries[0].epoch).toBe(50);
  });

  test("emits one wantedEntry per distinct (table, epoch) pair", () => {
    const items: StakedSuiJson[] = [
      { id: "0xs1", pool_id: "0xpA", stake_activation_epoch: 50, principal: "1" },
      { id: "0xs2", pool_id: "0xpA", stake_activation_epoch: 60, principal: "1" }, // same table, new epoch
      { id: "0xs3", pool_id: "0xpB", stake_activation_epoch: 50, principal: "1" }, // new table, same epoch
    ];
    const { wantedEntries } = planActivationRateLookups(
      items,
      100n,
      new Map([refs("0xpA", "0xratesA"), refs("0xpB", "0xratesB")]),
    );
    expect(wantedEntries).toHaveLength(3);
  });

  test("drops orphan-pool stakes from wantedEntries; activeStakes still includes them", () => {
    // activeStakes mirrors what `groupStakedSuiByPool` will iterate;
    // orphans stay in the list with reward "0" (no rate to look up).
    const items: StakedSuiJson[] = [
      { id: "0xs", pool_id: "0xorphan", stake_activation_epoch: 50, principal: "100" },
    ];
    const { activeStakes, wantedEntries } = planActivationRateLookups(items, 100n, new Map());
    expect(activeStakes).toHaveLength(1);
    expect(wantedEntries).toHaveLength(0);
  });
});

// ----- computeStakeRewards ------------------------------------------------

describe("computeStakeRewards", () => {
  const plan = (stakedSuiId: string, poolId: string, activationEpoch: string | number): RatePlan => ({
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

  test("computes the pool-token reward for a stake whose rate is present", () => {
    const rewards = computeStakeRewards(
      [plan("0xs", "0xp", 50)],
      new Map([["0xp", poolRef("0xrates")]]),
      // Activation rate: 1 SUI = 1 pool token. Reward = 110 − 100 = 10.
      new Map([["0xrates@50", { sui_amount: 1000, pool_token_amount: 1000 }]]),
    );
    expect(rewards.get("0xs")).toBe(10n);
  });

  test("skips stakes whose rate is null (entry absent → caller defaults to '0')", () => {
    const rewards = computeStakeRewards(
      [plan("0xs", "0xp", 50)],
      new Map([["0xp", poolRef("0xrates")]]),
      new Map<string, ExchangeRate | null>([["0xrates@50", null]]),
    );
    expect(rewards.has("0xs")).toBe(false);
  });

  test("skips stakes whose rate key is missing entirely", () => {
    const rewards = computeStakeRewards(
      [plan("0xs", "0xp", 50)],
      new Map([["0xp", poolRef("0xrates")]]),
      new Map(), // no rate at all
    );
    expect(rewards.has("0xs")).toBe(false);
  });

  test("skips orphan-pool stakes (no PoolRefs entry)", () => {
    const rewards = computeStakeRewards(
      [plan("0xs", "0xorphan", 50)],
      new Map(), // orphan
      new Map(),
    );
    expect(rewards.size).toBe(0);
  });
});

// ----- parseExchangeRateNode ----------------------------------------------

describe("parseExchangeRateNode", () => {
  test("extracts a valid ExchangeRate from a MoveValue dynamicField", () => {
    const node: ExchangeRateAddrNode = {
      dynamicField: {
        value: { __typename: "MoveValue", json: { sui_amount: "1100", pool_token_amount: "1000" } },
      },
    };
    expect(parseExchangeRateNode(node)).toEqual({
      sui_amount: "1100",
      pool_token_amount: "1000",
    });
  });

  test("returns null for a null root (no address)", () => {
    expect(parseExchangeRateNode(null)).toBeNull();
  });

  test("returns null when dynamicField is absent", () => {
    expect(parseExchangeRateNode({ dynamicField: null })).toBeNull();
    expect(parseExchangeRateNode({})).toBeNull();
  });

  test("returns null when value typename is not MoveValue (union mismatch)", () => {
    const node: ExchangeRateAddrNode = {
      dynamicField: {
        value: { __typename: "MoveObject", json: { sui_amount: 1, pool_token_amount: 1 } },
      },
    };
    expect(parseExchangeRateNode(node)).toBeNull();
  });

  test("returns null when json fails the ExchangeRate predicate", () => {
    const node: ExchangeRateAddrNode = {
      dynamicField: {
        // wrong field names — schema drift simulation
        value: { __typename: "MoveValue", json: { sui: 1, pool_tokens: 1 } },
      },
    };
    expect(parseExchangeRateNode(node)).toBeNull();
  });
});

// ----- BATCH_RATES_15 structural invariant --------------------------------

describe("BATCH_RATES_15 structural invariant", () => {
  test("alias count stays in lock-step with RATE_BATCH_CHUNK_SIZE", () => {
    // Guards the comment-only contract in `queries.ts`: `fetchRateChunk`
    // builds a variable map of size RATE_BATCH_CHUNK_SIZE and the document
    // must have exactly that many `vN:` aliases or the server rejects the
    // request shape (caller-side TS can't see this, see `@ts-expect-error`).
    const op = (BATCH_RATES_15 as { definitions: ReadonlyArray<unknown> }).definitions[0] as {
      kind?: string;
      selectionSet?: { selections: ReadonlyArray<{ kind: string; alias?: { value: string } }> };
    };
    expect(op.kind).toBe("OperationDefinition");
    const aliases =
      op.selectionSet?.selections.filter(
        s => s.kind === "Field" && /^v\d+$/.test(s.alias?.value ?? ""),
      ).length ?? 0;
    expect(aliases).toBe(RATE_BATCH_CHUNK_SIZE);
  });
});
