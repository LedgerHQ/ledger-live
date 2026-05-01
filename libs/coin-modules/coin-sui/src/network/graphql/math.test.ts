/**
 * Pure-math tests for `computeEstimatedReward` (pool-token model) and
 * `computeApy` (exchange-rate growth). Pins the formulas against
 * JSON-RPC parity using small integers.
 */
import { ONE_SUI } from "../../constants";
import { computeApy, computeEstimatedReward } from "./math";

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
