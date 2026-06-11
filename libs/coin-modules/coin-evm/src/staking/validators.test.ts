import network from "@ledgerhq/live-network";
import {
  clearValidatorsCache,
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
      expect(first).toEqual({
        items: [
          expect.objectContaining({
            validatorAddress: "seivaloper1abc",
            name: "John",
            commission: 0.05,
            // REST returns usei (6 decimals); scaled to sei_evm's 18-decimal unit (×10^12).
            tokens: "100000000000000",
            votingPower: 0,
            estimatedYearlyRewardsRate: 0,
          }),
          expect.objectContaining({
            validatorAddress: "seivaloper1def",
            name: "Doe",
            commission: 1,
            tokens: "999000000000000",
            votingPower: 1,
            estimatedYearlyRewardsRate: 0,
          }),
        ],
        next: undefined,
      });

      expect(await getValidators("sei_evm")).toEqual(first);
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
    });

    it("caches each cursor page under a separate key", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      await getValidators("sei_evm", "5");
      expect(mockedNetwork).toHaveBeenCalledTimes(2);

      await getValidators("sei_evm");
      await getValidators("sei_evm", "5");
      expect(mockedNetwork).toHaveBeenCalledTimes(2);
    });

    it("clearValidatorsCache(currencyId) evicts every cached page of that currency", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      await getValidators("sei_evm");
      await getValidators("sei_evm", "5");
      expect(mockedNetwork).toHaveBeenCalledTimes(2);

      clearValidatorsCache("sei_evm");

      await getValidators("sei_evm");
      await getValidators("sei_evm", "5");
      expect(mockedNetwork).toHaveBeenCalledTimes(4);
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
      await getValidators("sei_evm");

      // empty results are not cached, so each call hits the network again
      expect(mockedNetwork).toHaveBeenCalledTimes(2);
    });

    it("returns an empty page for currencies without a validator API", async () => {
      expect(await getValidators("ethereum")).toEqual({ items: [], next: undefined });
      expect(mockedNetwork).not.toHaveBeenCalled();
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

      expect(second).toEqual({
        items: [
          expect.objectContaining({ validatorAddress: "seivaloper1abc" }),
          expect.objectContaining({ validatorAddress: "seivaloper1def" }),
        ],
        next: undefined,
      });
      expect(mockedNetwork).toHaveBeenCalledTimes(2);

      releaseFirst(cosmosValidatorsPayload);
      await firstCall;

      expect(mockedNetwork).toHaveBeenCalledTimes(2);
    });
  });

  describe("cache TTL", () => {
    // lru-cache reads its TTL clock from performance.now() (or Date.now() as a
    // fallback), so we drive both forward to simulate the entry going stale.
    const setNow = (ms: number) => {
      jest.spyOn(performance, "now").mockReturnValue(ms);
      jest.spyOn(Date, "now").mockReturnValue(ms);
    };

    afterEach(async () => {
      jest.restoreAllMocks();
      // The validators cache is a module singleton; let lru-cache's debounced clock
      // (cachedNow, reset via a 1ms timer) settle so the mocked time doesn't leak
      // into other tests and make their fresh entries look stale.
      await new Promise(resolve => setTimeout(resolve, 5));
    });

    it("refetches after the cache TTL expires", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      // non-zero base: lru-cache treats a start time of 0 as "no TTL"
      setNow(1000);
      await getValidators("sei_evm");
      expect(mockedNetwork).toHaveBeenCalledTimes(1);

      // lru-cache debounces its clock read for `ttlResolution` (1ms) via a real
      // setTimeout; wait it out so the next read picks up the advanced time.
      await new Promise(resolve => setTimeout(resolve, 5));

      setNow(32000); // 31s later, past the 30s TTL
      await getValidators("sei_evm");

      expect(mockedNetwork).toHaveBeenCalledTimes(2);
    });
  });

  describe("prefetchValidators", () => {
    it("warms the cache so a later read hits no network", async () => {
      mockedNetwork.mockResolvedValue(cosmosValidatorsPayload);

      prefetchValidators("sei_evm");
      await Promise.resolve();
      await Promise.resolve();
      expect(mockedNetwork).toHaveBeenCalledTimes(1);

      // the warmed entry serves the subsequent read without another network call
      await getValidators("sei_evm");
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
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
              // Token amounts coming from Sei validator API are usei (6 decimals) integer strings
              tokens: "42",
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
          // 42 usei scaled to sei_evm's 18-decimal unit (×10^12).
          balance: 42000000000000n,
          commissionRate: "0.1",
          apy: 0,
        },
      ]);
    });
  });
});
