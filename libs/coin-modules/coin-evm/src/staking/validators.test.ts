import network from "@ledgerhq/live-network";
import {
  clearValidatorsCache,
  getCachedValidators,
  getFrameworkValidators,
  getUnbondingPeriodDays,
  getValidatorExplorerUrl,
  getValidators,
  hasUnbondingPeriod,
  prefetchValidators,
} from "./validators";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);

const cosmosValidatorsPayload = {
  status: 200,
  data: {
    validators: [
      {
        operator_address: "seivaloper1abc",
        description: { moniker: "John" },
        commission: { commission_rates: { rate: "0.05" } },
        tokens: "100",
      },
      {
        operator_address: "seivaloper1def",
        description: { moniker: "Doe" },
        commission: { commission_rates: { rate: "1" } },
        tokens: "999",
      },
    ],
  },
};

describe("staking/validators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidatorsCache();
    expect(getCachedValidators("sei_evm")).toBeUndefined();
  });

  describe("getValidators + cache", () => {
    it("fetches Sei validators from REST and caches non-empty results", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      const first = await getValidators("sei_evm");

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("rest.sei-apis.com"),
          method: "GET",
        }),
      );
      expect(first.next).toBeUndefined();
      expect(first.items).toEqual([
        expect.objectContaining({
          validatorAddress: "seivaloper1abc",
          name: "John",
          commission: 0.05,
          tokens: 100,
          votingPower: 0,
          estimatedYearlyRewardsRate: 0,
        }),
        expect.objectContaining({
          validatorAddress: "seivaloper1def",
          name: "Doe",
          commission: 1,
          tokens: 999,
          votingPower: 1,
          estimatedYearlyRewardsRate: 0,
        }),
      ]);
      expect(getCachedValidators("sei_evm")).toEqual(first);
    });

    it("returns cached data without a second network call while fresh", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      await getValidators("sei_evm");

      expect(mockedNetwork).toHaveBeenCalledTimes(1);
    });

    it("does not cache an empty validator list", async () => {
      mockedNetwork.mockResolvedValue({ status: 200, data: { validators: [] } });

      await getValidators("sei_evm");

      expect(getCachedValidators("sei_evm")).toBeUndefined();
    });

    it("returns an empty page for currencies without a validator API", async () => {
      const result = await getValidators("ethereum");

      expect(result.items).toEqual([]);
      expect(result.next).toBeUndefined();
      expect(mockedNetwork).not.toHaveBeenCalled();
      expect(getCachedValidators("ethereum")).toBeUndefined();
    });

    it("clearValidatorsCache drops cached entries for the given currency", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      expect(getCachedValidators("sei_evm")).toEqual({
        items: [
          {
            validatorAddress: "seivaloper1abc",
            name: "John",
            commission: 0.05,
            tokens: 100,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
          {
            validatorAddress: "seivaloper1def",
            name: "Doe",
            commission: 1,
            tokens: 999,
            votingPower: 1,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: undefined,
      });

      clearValidatorsCache("sei_evm");

      expect(getCachedValidators("sei_evm")).toBeUndefined();
    });
  });

  describe("getCachedValidators TTL", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns undefined after cache TTL expires", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      expect(getCachedValidators("sei_evm")).toEqual({
        items: [
          {
            validatorAddress: "seivaloper1abc",
            name: "John",
            commission: 0.05,
            tokens: 100,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
          {
            validatorAddress: "seivaloper1def",
            name: "Doe",
            commission: 1,
            tokens: 999,
            votingPower: 1,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: undefined,
      });

      jest.advanceTimersByTime(31_000);

      expect(getCachedValidators("sei_evm")).toBeUndefined();
    });
  });

  describe("prefetchValidators", () => {
    it("warms the cache without throwing", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      prefetchValidators("sei_evm");
      await Promise.resolve();
      await Promise.resolve();

      expect(getCachedValidators("sei_evm")).toEqual({
        items: [
          {
            validatorAddress: "seivaloper1abc",
            name: "John",
            commission: 0.05,
            tokens: 100,
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          },
          {
            validatorAddress: "seivaloper1def",
            name: "Doe",
            commission: 1,
            tokens: 999,
            votingPower: 1,
            estimatedYearlyRewardsRate: 0,
          },
        ],
        next: undefined,
      });
    });

    it("is a no-op when cache is already fresh", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      expect(mockedNetwork).toHaveBeenCalledTimes(1);

      prefetchValidators("sei_evm");
      await Promise.resolve();

      expect(mockedNetwork).toHaveBeenCalledTimes(1);
    });
  });

  describe("explorer & unbonding helpers", () => {
    it("getValidatorExplorerUrl substitutes the validator address", () => {
      expect(getValidatorExplorerUrl("sei_evm", "ADDR")).toBe(
        "https://seistream.app/validators/ADDR",
      );
    });

    it("getUnbondingPeriodDays returns Sei config", () => {
      expect(getUnbondingPeriodDays("sei_evm")).toBe(21);
    });

    it.each(["celo", "__unknown__"])(
      "getUnbondingPeriodDays returns undefined without config (%s)",
      currencyId => {
        expect(getUnbondingPeriodDays(currencyId)).toBeUndefined();
      },
    );

    it("hasUnbondingPeriod is true for Sei", () => {
      expect(hasUnbondingPeriod("sei_evm")).toBe(true);
    });

    it.each(["celo", "__unknown__"])(
      "hasUnbondingPeriod is false without configured unbonding (%s)",
      currencyId => {
        expect(hasUnbondingPeriod(currencyId)).toBe(false);
      },
    );
  });

  describe("getFrameworkValidators", () => {
    it("maps staking items to the framework Validator page shape", async () => {
      mockedNetwork.mockResolvedValue({
        status: 200,
        data: {
          validators: [
            {
              operator_address: "seivaloper1x",
              description: { moniker: "X" },
              commission: { commission_rates: { rate: "0.1" } },
              tokens: "42.5",
            },
          ],
        },
      });

      const page = await getFrameworkValidators("sei_evm");

      expect(page.next).toBeUndefined();
      expect(page.items).toEqual([
        {
          address: "seivaloper1x",
          name: "X",
          balance: 42n,
          commissionRate: "0.1",
          apy: 0,
        },
      ]);
    });
  });
});
