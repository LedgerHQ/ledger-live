import { EpochInfo, StakePool } from "../api/api-types";
import { computePoolApy } from "./computePoolApy";

// 22B ADA active stake → z0 = 1/k = 0.002 of total stake = 44M ADA saturation point.
const baseEpoch: EpochInfo = {
  number: 634,
  reserves: "14000000000000000", // 14B ADA
  activeStake: "22000000000000000", // 22B ADA
  params: { a0: 0.3, rho: 0.003, tau: 0.2 },
};

const basePool: StakePool = {
  poolId: "pool1abc",
  name: "Stake Pool",
  ticker: "STK",
  website: "https://pool.example",
  margin: "2.00", // 2%
  cost: "340000000", // 340 ADA
  pledge: "1000000000000", // 1M ADA
  retiredEpoch: undefined,
  liveStake: "30000000000000", // 30M ADA
};

describe("computePoolApy", () => {
  it("returns a plausible mainnet APY for a healthy pool", () => {
    const apy = computePoolApy(basePool, baseEpoch);
    // Sanity bounds: real Cardano APY sits ~3–10% depending on reserves / saturation.
    expect(apy).toBeGreaterThan(0.03);
    expect(apy).toBeLessThan(0.12);
  });

  it.each([
    ["a retired pool", { ...basePool, retiredEpoch: 400 }, baseEpoch],
    ["a pool with zero stake", { ...basePool, liveStake: "0" }, baseEpoch],
    // Tiny pool, huge fixed cost → expected reward doesn't cover the cost → no delegator yield.
    ["a pool whose reward < fixed cost", { ...basePool, liveStake: "1000000000", cost: "100000000000000" }, baseEpoch],
    // Endpoint doesn't expose these yet (LIVE-18622) → APY stays omitted.
    ["an epoch missing reserves", basePool, { ...baseEpoch, reserves: undefined }],
    ["an epoch missing active stake", basePool, { ...baseEpoch, activeStake: undefined }],
  ])("returns 0 for %s", (_label, pool, epoch) => {
    expect(computePoolApy(pool, epoch)).toBe(0);
  });

  it("decreases when the pool saturates beyond z0", () => {
    // z0 = 1/k = 0.002 of total stake = 44M ADA.
    const healthy = computePoolApy({ ...basePool, liveStake: "40000000000000" }, baseEpoch);
    const oversaturated = computePoolApy({ ...basePool, liveStake: "100000000000000" }, baseEpoch);
    expect(oversaturated).toBeLessThan(healthy);
  });

  it("decreases when margin increases (delegators lose more to operator)", () => {
    const low = computePoolApy({ ...basePool, margin: "1.00" }, baseEpoch);
    const high = computePoolApy({ ...basePool, margin: "10.00" }, baseEpoch);
    expect(high).toBeLessThan(low);
  });

  it("increases with higher pledge (a0 incentive)", () => {
    const lowPledge = computePoolApy({ ...basePool, pledge: "100000000000" }, baseEpoch);
    const highPledge = computePoolApy(
      { ...basePool, pledge: "30000000000000" }, // pledge matches liveStake
      baseEpoch,
    );
    expect(highPledge).toBeGreaterThan(lowPledge);
  });

  it("decreases as reserves are depleted", () => {
    const lowReserves = computePoolApy(basePool, {
      ...baseEpoch,
      reserves: "5000000000000000",
    });
    const highReserves = computePoolApy(basePool, {
      ...baseEpoch,
      reserves: "14000000000000000",
    });
    expect(lowReserves).toBeLessThan(highReserves);
  });
});
