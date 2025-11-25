import { fetchSuiBannerConfig, registerSuiStakingPromotion } from "./api";

const VALID_SUI_ADDRESS = "0xab4fb3eeaa7b0ab4f91eedab33adf140c6750e60ca5e44b3df82491937d7bab4";
const INVALID_SUI_ADDRESS = "0xinvalid";
const SUI_PROMOTION_ID = "earn-sui-reward-dec2025";

const mockPromotion = {
  promotionId: SUI_PROMOTION_ID,
  currencyFrom: null,
  currencyTo: "SUI",
  endDate: "2025-12-20",
  product: "staking",
  isRegisterable: true,
  displayUntil: null,
};

const mockRegistrationStatus = {
  isRegistered: false,
  meetsRequirements: true,
  ticketCount: null,
  totalVolume: null,
};

describe("sui/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("fetchSuiBannerConfig", () => {
    it("should return all false when promotions API fails", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: false,
        showIncentiveBanner: false,
        isRegisterable: false,
      });
    });

    it("should return all false when promotion is not found", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: false,
        showIncentiveBanner: false,
        isRegisterable: false,
      });
    });

    it("should return all false when promotion is not registerable", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ ...mockPromotion, isRegisterable: false }]),
      });

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: false,
        showIncentiveBanner: false,
        isRegisterable: false,
      });
    });

    it("should return boost banner when no address provided", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockPromotion]),
      });

      const result = await fetchSuiBannerConfig();

      expect(result).toEqual({
        showBoostBanner: true,
        showIncentiveBanner: false,
        isRegisterable: true,
      });
    });

    it("should return boost banner when address is invalid", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockPromotion]),
      });

      const result = await fetchSuiBannerConfig(INVALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: true,
        showIncentiveBanner: false,
        isRegisterable: true,
      });
    });

    it("should return all false when registration status API fails", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPromotion]),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: false,
        showIncentiveBanner: false,
        isRegisterable: false,
      });
    });

    it("should return boost banner when user is not registered", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPromotion]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockRegistrationStatus, isRegistered: false }),
        });

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: true,
        showIncentiveBanner: false,
        isRegisterable: true,
      });
    });

    it("should return incentive banner when user is registered", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPromotion]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ...mockRegistrationStatus, isRegistered: true }),
        });

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: false,
        showIncentiveBanner: true,
        isRegisterable: true,
      });
    });

    it("should return all false when fetch throws an error", async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchSuiBannerConfig(VALID_SUI_ADDRESS);

      expect(result).toEqual({
        showBoostBanner: false,
        showIncentiveBanner: false,
        isRegisterable: false,
      });
    });
  });

  describe("registerSuiStakingPromotion", () => {
    it("should not call API when address is invalid", async () => {
      global.fetch = jest.fn();

      await registerSuiStakingPromotion(INVALID_SUI_ADDRESS);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should call API with correct parameters for valid address", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
      });

      await registerSuiStakingPromotion(VALID_SUI_ADDRESS);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/register"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            promotionId: SUI_PROMOTION_ID,
            address: VALID_SUI_ADDRESS,
          }),
        }),
      );
    });

    it("should not throw when API returns error", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(registerSuiStakingPromotion(VALID_SUI_ADDRESS)).resolves.toBeUndefined();
    });

    it("should not throw when fetch throws an error", async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

      await expect(registerSuiStakingPromotion(VALID_SUI_ADDRESS)).resolves.toBeUndefined();
    });
  });
});
