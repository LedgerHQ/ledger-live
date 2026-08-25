import { apiClient } from "../network/api";
import type { AleoCommitteeResponse } from "../types/api";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import coinConfig from "../config";
import { getValidators } from "./getValidators";

jest.mock("../network/api");

const OPEN_HIGH_STAKE = "aleo1open_high";
const OPEN_LOW_STAKE = "aleo1open_low";
const CLOSED_HIGH_STAKE = "aleo1closed_high";

// Supply equal to the staked total makes the gross rate exactly the inflation rate
// (0.05 * S / S), so each expectation below stays readable.
const TOTAL_SUPPLY_CREDITS = 100;
const committee: AleoCommitteeResponse = {
  total_stake: 100 * 1_000_000,
  members: {
    [CLOSED_HIGH_STAKE]: [50 * 1_000_000, false, 0],
    [OPEN_LOW_STAKE]: [10 * 1_000_000, true, 50],
    [OPEN_HIGH_STAKE]: [20 * 1_000_000, true, 0],
  },
};

describe("getValidators", () => {
  let currencyIdCounter = 0;
  // getValidators is LRU-cached by currency id, so every test needs a fresh key or it
  // would be served the previous test's result.
  const freshCurrencyId = () => `aleo_test_${currencyIdCounter++}`;

  beforeEach(() => {
    jest.clearAllMocks();
    coinConfig.setCoinConfig(() => getMockedConfig("mainnet"));

    jest.mocked(apiClient.getCommittee).mockResolvedValue(committee);
    jest.mocked(apiClient.getValidatorMetadata).mockResolvedValue({
      [OPEN_HIGH_STAKE]: "High Stake Validator",
    });
    jest.mocked(apiClient.getTotalSupply).mockResolvedValue(TOTAL_SUPPLY_CREDITS);
  });

  it("orders open validators first, then by descending stake", async () => {
    const validators = await getValidators(freshCurrencyId());

    expect(validators.map(v => v.address)).toEqual([
      OPEN_HIGH_STAKE,
      OPEN_LOW_STAKE,
      CLOSED_HIGH_STAKE,
    ]);
  });

  it("resolves names where metadata has one and leaves the rest unnamed", async () => {
    const validators = await getValidators(freshCurrencyId());

    expect(validators.find(v => v.address === OPEN_HIGH_STAKE)?.name).toBe("High Stake Validator");
    expect(validators.find(v => v.address === OPEN_LOW_STAKE)?.name).toBeUndefined();
  });

  it("derives the net rate from commission", async () => {
    const validators = await getValidators(freshCurrencyId());

    // Gross is 5%; a 0% commission keeps all of it, a 50% commission keeps half.
    expect(validators.find(v => v.address === OPEN_HIGH_STAKE)?.estimatedYearlyRewardsRate).toBe(
      0.05,
    );
    expect(validators.find(v => v.address === OPEN_LOW_STAKE)?.estimatedYearlyRewardsRate).toBe(
      0.025,
    );
  });

  it("reports a zero rate for a validator over the 25% concentration cap", async () => {
    const validators = await getValidators(freshCurrencyId());

    // 50 of 100 credits staked — earns nothing despite charging no commission.
    expect(validators.find(v => v.address === CLOSED_HIGH_STAKE)?.estimatedYearlyRewardsRate).toBe(
      0,
    );
  });

  it("fetches committee, names and supply concurrently", async () => {
    await getValidators(freshCurrencyId());

    expect(apiClient.getCommittee).toHaveBeenCalledTimes(1);
    expect(apiClient.getValidatorMetadata).toHaveBeenCalledTimes(1);
    expect(apiClient.getTotalSupply).toHaveBeenCalledTimes(1);
  });

  describe("degraded responses", () => {
    it("still returns a usable list when the names fetch fails", async () => {
      jest.mocked(apiClient.getValidatorMetadata).mockRejectedValue(new Error("boom"));

      const validators = await getValidators(freshCurrencyId());

      expect(validators).toHaveLength(3);
      expect(validators.every(v => v.name === undefined)).toBe(true);
    });

    it("ignores a malformed names payload rather than ingesting junk", async () => {
      jest
        .mocked(apiClient.getValidatorMetadata)
        .mockResolvedValue({ [OPEN_HIGH_STAKE]: 42 } as never);

      const validators = await getValidators(freshCurrencyId());

      expect(validators.every(v => v.name === undefined)).toBe(true);
    });

    it("omits the rate — rather than reporting zero — when the supply fetch fails", async () => {
      jest.mocked(apiClient.getTotalSupply).mockRejectedValue(new Error("boom"));

      const validators = await getValidators(freshCurrencyId());

      expect(validators).toHaveLength(3);
      expect(validators.every(v => v.estimatedYearlyRewardsRate === undefined)).toBe(true);
    });

    it("omits the rate when the committee reports no total stake", async () => {
      jest.mocked(apiClient.getCommittee).mockResolvedValue({ members: committee.members ?? {} });

      const validators = await getValidators(freshCurrencyId());

      expect(validators.every(v => v.estimatedYearlyRewardsRate === undefined)).toBe(true);
    });

    it("throws on a malformed committee rather than building half a list", async () => {
      jest.mocked(apiClient.getCommittee).mockResolvedValue({ members: { bad: [1, 2] } } as never);

      await expect(getValidators(freshCurrencyId())).rejects.toThrow("invalid committee response");
    });
  });
});
