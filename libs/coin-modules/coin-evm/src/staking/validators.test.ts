import network from "@ledgerhq/live-network";
import {
  clearValidatorsCache,
  getCachedValidators,
  getUnbondingPeriodDays,
  getValidatorExplorerUrl,
  getValidators,
  getValidatorsPage,
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
      expect(first).toEqual([
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

    it("deduplicates concurrent in-flight fetches", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await Promise.all([getValidators("sei_evm"), getValidators("sei_evm")]);

      expect(mockedNetwork).toHaveBeenCalledTimes(1);
    });

    it("does not cache an empty validator list", async () => {
      mockedNetwork.mockResolvedValue({ status: 200, data: { validators: [] } });

      await getValidators("sei_evm");

      expect(getCachedValidators("sei_evm")).toBeUndefined();
    });

    it("bypasses cache when apiConfig is passed explicitly", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      await getValidators("sei_evm", { baseUrl: "https://x", validatorsEndpoint: "/y" });

      expect(mockedNetwork).toHaveBeenCalledTimes(2);
    });

    it("returns [] for currencies without a validator API", async () => {
      const result = await getValidators("ethereum");

      expect(result).toEqual([]);
      expect(mockedNetwork).not.toHaveBeenCalled();
      expect(getCachedValidators("ethereum")).toBeUndefined();
    });

    it("clearValidatorsCache removes an in-flight entry so the next call starts a fresh fetch", async () => {
      let releaseFirst!: (value: typeof cosmosValidatorsPayload) => void;
      const firstPending = new Promise<typeof cosmosValidatorsPayload>(resolve => {
        releaseFirst = resolve;
      });

      mockedNetwork.mockImplementationOnce(() => firstPending);
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      const firstCall = getValidators("sei_evm");

      clearValidatorsCache("sei_evm");

      const second = await getValidators("sei_evm");

      expect(second).toEqual([
        expect.objectContaining({ validatorAddress: "seivaloper1abc" }),
        expect.objectContaining({ validatorAddress: "seivaloper1def" }),
      ]);
      expect(mockedNetwork).toHaveBeenCalledTimes(2);

      releaseFirst(cosmosValidatorsPayload);
      await firstCall;

      expect(mockedNetwork).toHaveBeenCalledTimes(2);
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
      expect(getCachedValidators("sei_evm")).not.toBeUndefined();

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

      expect(getCachedValidators("sei_evm")).not.toBeUndefined();
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

    it("hasUnbondingPeriod is true for Sei and false without config", () => {
      expect(hasUnbondingPeriod("sei_evm")).toBe(true);
      expect(hasUnbondingPeriod("celo")).toBe(false);
      expect(hasUnbondingPeriod("unknown")).toBe(false);
    });
  });

  describe("getValidatorsPage", () => {
    it("maps staking items to the generic Validator page shape", async () => {
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

      const page = await getValidatorsPage("sei_evm");

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
