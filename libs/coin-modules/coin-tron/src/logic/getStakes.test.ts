import { BigNumber } from "bignumber.js";
import type { TronCoinConfig } from "../config";
import { fetchTronAccount } from "../network";
import type { TronResources } from "../types";
import { buildTronStakes, getStakes } from "./getStakes";
import { defaultTronResources, fetchTronResources } from "./tronResources";

jest.mock("../network", () => ({ fetchTronAccount: jest.fn() }));
jest.mock("./tronResources", () => {
  const actual = jest.requireActual("./tronResources");
  return { ...actual, fetchTronResources: jest.fn() };
});

const mockFetchTronAccount = jest.mocked(fetchTronAccount);
const mockFetchTronResources = jest.mocked(fetchTronResources);

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

const ADDRESS = "TQn9Y2khEsZaTgQGGvKmkVFhtsdfg4nqLA";
const SR_A = "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH";
const SR_B = "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U";
const NOW = new Date("2026-08-13T12:00:00.000Z");

const resources = (overrides: Partial<TronResources> = {}): TronResources => ({
  ...defaultTronResources,
  ...overrides,
});

/** 1 TRX of Tron Power is frozen as 1_000_000 sun. */
const frozenBandwidth = (trx: number) => ({
  bandwidth: { amount: new BigNumber(trx).multipliedBy(1_000_000) },
  energy: undefined,
});

describe("buildTronStakes", () => {
  it("emits one active stake per vote, in sun", () => {
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        frozen: frozenBandwidth(300),
        tronPower: 300,
        votes: [
          { address: SR_A, name: "SR A", voteCount: 200 },
          { address: SR_B, name: null, voteCount: 100 },
        ],
      }),
      NOW,
    );

    expect(stakes).toHaveLength(2);
    expect(stakes[0]).toMatchObject({
      uid: `${ADDRESS}:vote:${SR_A}`,
      address: ADDRESS,
      delegate: SR_A,
      state: "active",
      actions: ["redelegate", "undelegate"],
      amount: 200_000_000n,
      amountDeposited: 200_000_000n,
      amountRewarded: 0n,
      details: { voteCount: 200, validatorName: "SR A" },
    });
    expect(stakes[1].details).toEqual({ voteCount: 100 });
  });

  it("emits the unvoted Tron Power as its own inactive position", () => {
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        frozen: frozenBandwidth(300),
        tronPower: 300,
        votes: [{ address: SR_A, name: "SR A", voteCount: 120 }],
      }),
      NOW,
    );

    expect(stakes[1]).toMatchObject({
      uid: `${ADDRESS}:unvoted`,
      state: "inactive",
      actions: ["delegate", "undelegate"],
      amount: 180_000_000n,
      amountRewarded: 0n,
    });
    expect(stakes[1].delegate).toBeUndefined();
  });

  it("counts delegated and legacy frozen TRX as staked, and omits a zero remainder", () => {
    // Delegating a resource lends the bandwidth away but keeps the voting power, so the TRX is still
    // this account's stake — a `frozen`-only sum would report it as missing and emit no remainder.
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        frozen: frozenBandwidth(100),
        delegatedFrozen: { bandwidth: { amount: new BigNumber(50_000_000) }, energy: undefined },
        legacyFrozen: {
          bandwidth: { amount: new BigNumber(50_000_000), expiredAt: NOW },
          energy: undefined,
        },
        votes: [{ address: SR_A, name: "SR A", voteCount: 200 }],
      }),
      NOW,
    );

    expect(stakes).toHaveLength(1);
    expect(stakes[0].amountDeposited).toBe(200_000_000n);
  });

  it("splits the pending reward across votes and keeps the total exact", () => {
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        frozen: frozenBandwidth(3),
        tronPower: 3,
        // 10 sun over three equal votes divides unevenly; the last share absorbs the remainder.
        unwithdrawnReward: new BigNumber(10),
        votes: [
          { address: SR_A, name: "SR A", voteCount: 1 },
          { address: SR_B, name: "SR B", voteCount: 1 },
          { address: "TThirdSuperRep", name: "SR C", voteCount: 1 },
        ],
      }),
      NOW,
    );

    expect(stakes.map(stake => stake.amountRewarded)).toEqual([3n, 3n, 4n]);
    expect(stakes.reduce((total, stake) => total + (stake.amountRewarded ?? 0n), 0n)).toBe(10n);
    expect(stakes[0].actions).toContain("claim_reward");
  });

  it("carries a reward earned before unvoting on the unvoted position", () => {
    // Tron keeps paying out `unwithdrawnReward` until it is withdrawn, so the reward outlives the
    // votes that earned it and this case is reachable at all.
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        frozen: frozenBandwidth(3),
        tronPower: 3,
        unwithdrawnReward: new BigNumber(10),
        votes: [],
      }),
      NOW,
    );

    expect(stakes).toHaveLength(1);
    expect(stakes[0].uid).toBe(`${ADDRESS}:unvoted`);
    expect(stakes[0].amountRewarded).toBe(10n);
    expect(stakes[0].amountDeposited).toBe(3_000_000n);
    expect(stakes[0].amount).toBe(3_000_010n);
    expect(stakes[0].actions).toContain("claim_reward");
  });

  it("still reports an unwithdrawn reward once every TRX has been unfrozen", () => {
    const stakes = buildTronStakes(
      ADDRESS,
      resources({ unwithdrawnReward: new BigNumber(10) }),
      NOW,
    );

    expect(stakes).toHaveLength(1);
    expect(stakes[0].uid).toBe(`${ADDRESS}:unvoted`);
    expect(stakes[0].amountDeposited).toBe(0n);
    expect(stakes[0].amount).toBe(10n);
    expect(stakes[0].actions).toContain("claim_reward");
  });

  it("withholds claim_reward for 24h after the last withdrawal", () => {
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        frozen: frozenBandwidth(1),
        unwithdrawnReward: new BigNumber(500),
        lastWithdrawnRewardDate: new Date(NOW.getTime() - 60 * 60 * 1000),
        votes: [{ address: SR_A, name: "SR A", voteCount: 1 }],
      }),
      NOW,
    );

    expect(stakes[0].actions).toEqual(["redelegate", "undelegate"]);
    // The reward is still reported — only the action is withheld.
    expect(stakes[0].amountRewarded).toBe(500n);
  });

  it("marks an unfreezing entry withdrawable only once its expiry has passed", () => {
    const past = new Date(NOW.getTime() - 1000);
    const future = new Date(NOW.getTime() + 1000);
    const stakes = buildTronStakes(
      ADDRESS,
      resources({
        unFrozen: {
          bandwidth: [{ amount: new BigNumber(1_000_000), expireTime: past }],
          energy: [{ amount: new BigNumber(2_000_000), expireTime: future }],
        },
      }),
      NOW,
    );

    expect(stakes[0]).toMatchObject({
      uid: `${ADDRESS}:unfreeze:BANDWIDTH:${past.getTime()}`,
      state: "withdrawable",
      actions: ["withdraw"],
      stateUpdatedAt: past,
      amount: 1_000_000n,
      details: { resource: "BANDWIDTH", availableAt: past.toISOString() },
    });
    expect(stakes[1]).toMatchObject({
      state: "deactivating",
      actions: [],
      amount: 2_000_000n,
    });
    expect(stakes[1].stateUpdatedAt).toBeUndefined();
  });

  it("returns nothing for an account with no frozen TRX", () => {
    expect(buildTronStakes(ADDRESS, resources(), NOW)).toEqual([]);
  });
});

describe("getStakes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an empty page for an address the chain does not know", async () => {
    mockFetchTronAccount.mockResolvedValue([]);

    await expect(getStakes(mockConfig, ADDRESS)).resolves.toEqual({ items: [] });
    expect(mockFetchTronResources).not.toHaveBeenCalled();
  });

  it("builds the positions from the account's tron resources", async () => {
    mockFetchTronAccount.mockResolvedValue([{ address: ADDRESS }] as never);
    mockFetchTronResources.mockResolvedValue(
      resources({
        frozen: frozenBandwidth(10),
        votes: [{ address: SR_A, name: "SR A", voteCount: 10 }],
      }),
    );

    const { items, next } = await getStakes(mockConfig, ADDRESS);

    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(10_000_000n);
    expect(next).toBeUndefined();
  });

  it("rejects a cursor rather than looping a paginating caller", async () => {
    await expect(getStakes(mockConfig, ADDRESS, "cursor")).rejects.toThrow("does not paginate");
  });
});
