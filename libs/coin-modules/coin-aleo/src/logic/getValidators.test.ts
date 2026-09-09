import { apiClient } from "../network/api";
import type { AleoCommitteeResponse } from "../types/api";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import coinConfig from "../config";
import { MICROCREDITS_PER_CREDIT } from "../constants";
import { getValidators } from "./getValidators";

jest.mock("../network/api");

const OPEN_HIGH_STAKE = "aleo1open_high";
const OPEN_LOW_STAKE = "aleo1open_low";
const CLOSED_HIGH_STAKE = "aleo1closed_high";

const UNBONDING_RAW = "{\n  microcredits: 10000000000u64,\n  height: 7862785u32\n}";

const microcredits = (credits: number) => credits * MICROCREDITS_PER_CREDIT;

const TOTAL_STAKE_CREDITS = 200_000_000;
const TOTAL_SUPPLY_CREDITS = TOTAL_STAKE_CREDITS;
const GROSS_RATE = 0.05;
const committee: AleoCommitteeResponse = {
  total_stake: microcredits(TOTAL_STAKE_CREDITS),
  members: {
    [CLOSED_HIGH_STAKE]: [microcredits(100_000_000), false, 0],
    [OPEN_LOW_STAKE]: [microcredits(20_000_000), true, 50],
    [OPEN_HIGH_STAKE]: [microcredits(40_000_000), true, 0],
  },
};

const CURRENCY_ID = "aleo";

describe("getValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getValidators.reset();
    coinConfig.setCoinConfig(() => getMockedConfig("mainnet"));

    jest.mocked(apiClient.getCommittee).mockResolvedValue(committee);
    jest.mocked(apiClient.getValidatorMetadata).mockResolvedValue({
      [OPEN_HIGH_STAKE]: "High Stake Validator",
    });
    jest.mocked(apiClient.getTotalSupply).mockResolvedValue(TOTAL_SUPPLY_CREDITS);
    jest.mocked(apiClient.getUnbondingMapping).mockResolvedValue(null);
  });

  it("orders open validators first, then by descending stake", async () => {
    const validators = await getValidators(CURRENCY_ID);

    expect(validators.map(v => v.address)).toEqual([
      OPEN_HIGH_STAKE,
      OPEN_LOW_STAKE,
      CLOSED_HIGH_STAKE,
    ]);
  });

  it("resolves names where metadata has one and leaves the rest unnamed", async () => {
    const validators = await getValidators(CURRENCY_ID);

    expect(validators.find(v => v.address === OPEN_HIGH_STAKE)?.name).toBe("High Stake Validator");
    expect(validators.find(v => v.address === OPEN_LOW_STAKE)?.name).toBeUndefined();
  });

  it("keeps the whole gross rate at zero commission and half of it at 50%", async () => {
    const validators = await getValidators(CURRENCY_ID);

    expect(validators.find(v => v.address === OPEN_HIGH_STAKE)?.estimatedYearlyRewardsRate).toBe(
      GROSS_RATE,
    );
    expect(validators.find(v => v.address === OPEN_LOW_STAKE)?.estimatedYearlyRewardsRate).toBe(
      GROSS_RATE / 2,
    );
  });

  it("reports a zero rate over the 25% concentration cap, even at zero commission", async () => {
    const validators = await getValidators(CURRENCY_ID);

    expect(validators.find(v => v.address === CLOSED_HIGH_STAKE)?.estimatedYearlyRewardsRate).toBe(
      0,
    );
  });

  it("fetches committee, names and supply concurrently", async () => {
    await getValidators(CURRENCY_ID);

    expect(apiClient.getCommittee).toHaveBeenCalledTimes(1);
    expect(apiClient.getValidatorMetadata).toHaveBeenCalledTimes(1);
    expect(apiClient.getTotalSupply).toHaveBeenCalledTimes(1);
  });

  describe("unbonding validators", () => {
    const unbondingOnly = (unbonding: string[]) =>
      jest
        .mocked(apiClient.getUnbondingMapping)
        .mockImplementation(async (_config, address) =>
          unbonding.includes(address) ? UNBONDING_RAW : null,
        );

    it("flags a validator that has an unbonding entry of its own", async () => {
      unbondingOnly([OPEN_HIGH_STAKE]);

      const validators = await getValidators(CURRENCY_ID);

      expect(validators.find(v => v.address === OPEN_HIGH_STAKE)?.isUnbonding).toBe(true);
      expect(validators.find(v => v.address === OPEN_LOW_STAKE)?.isUnbonding).toBe(false);
    });

    it("demotes an unbonding validator below the open ones, despite the higher stake", async () => {
      unbondingOnly([OPEN_HIGH_STAKE]);

      const validators = await getValidators(CURRENCY_ID);

      // Behind the one validator still taking stake, then among the rest by descending stake.
      expect(validators.map(v => v.address)).toEqual([
        OPEN_LOW_STAKE,
        CLOSED_HIGH_STAKE,
        OPEN_HIGH_STAKE,
      ]);
    });

    it("reports no unbonding rather than failing the list when the lookup errors", async () => {
      jest.mocked(apiClient.getUnbondingMapping).mockRejectedValue(new Error("boom"));

      const validators = await getValidators(CURRENCY_ID);

      expect(validators).toHaveLength(3);
      expect(validators.every(v => v.isUnbonding === false)).toBe(true);
    });
  });

  describe("degraded responses", () => {
    it("still returns a usable list when the names fetch fails", async () => {
      jest.mocked(apiClient.getValidatorMetadata).mockRejectedValue(new Error("boom"));

      const validators = await getValidators(CURRENCY_ID);

      expect(validators).toHaveLength(3);
      expect(validators.every(v => v.name === undefined)).toBe(true);
    });

    it("ignores a malformed names payload rather than ingesting junk", async () => {
      jest
        .mocked(apiClient.getValidatorMetadata)
        .mockResolvedValue({ [OPEN_HIGH_STAKE]: 42 } as never);

      const validators = await getValidators(CURRENCY_ID);

      expect(validators.every(v => v.name === undefined)).toBe(true);
    });

    it("omits the rate — rather than reporting zero — when the supply fetch fails", async () => {
      jest.mocked(apiClient.getTotalSupply).mockRejectedValue(new Error("boom"));

      const validators = await getValidators(CURRENCY_ID);

      expect(validators).toHaveLength(3);
      expect(validators.every(v => v.estimatedYearlyRewardsRate === undefined)).toBe(true);
    });

    it("omits the rate when the committee reports no total stake", async () => {
      jest.mocked(apiClient.getCommittee).mockResolvedValue({ members: committee.members });

      const validators = await getValidators(CURRENCY_ID);

      expect(validators.every(v => v.estimatedYearlyRewardsRate === undefined)).toBe(true);
    });

    it.each([
      ["a malformed member tuple", { members: { bad: [1, 2] } }],
      ["no members at all", {}],
      ["an error envelope", { error: "upstream unavailable" }],
      ["members sent as an array", { members: [[50 * 1_000_000, true, 0]] }],
      ["a NaN stake", { members: { [OPEN_HIGH_STAKE]: [NaN, true, 0] } }],
      ["an infinite stake", { members: { [OPEN_HIGH_STAKE]: [Infinity, true, 0] } }],
      ["a negative stake", { members: { [OPEN_HIGH_STAKE]: [-1, true, 0] } }],
      ["a NaN commission", { members: { [OPEN_HIGH_STAKE]: [10 * 1_000_000, true, NaN] } }],
      ["a negative commission", { members: { [OPEN_HIGH_STAKE]: [10 * 1_000_000, true, -1] } }],
      ["a commission above 100%", { members: { [OPEN_HIGH_STAKE]: [10 * 1_000_000, true, 101] } }],
    ])("throws on %s rather than caching an empty list", async (_label, response) => {
      jest.mocked(apiClient.getCommittee).mockResolvedValue(response as never);

      await expect(getValidators(CURRENCY_ID)).rejects.toThrow("invalid committee response");
    });
  });
});
