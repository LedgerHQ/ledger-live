import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { isPortfolioEnabledFor } from "./portfolio/config";
import { genericValidateAddress } from "./validateAddress";

const mockValidateAddress = jest.fn();
const mockGetCoinModuleApi = jest.fn();

jest.mock("./api", () => ({
  getCoinModuleApi: (...a: any[]) => mockGetCoinModuleApi(...a),
}));
jest.mock("./networkPortfolio", () => ({ openCurrencyPortfolio: jest.fn() }));
jest.mock("./portfolio/config", () => ({ isPortfolioEnabledFor: jest.fn(() => false) }));

describe("genericValidateAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isPortfolioEnabledFor).mockReturnValue(false);
    mockGetCoinModuleApi.mockResolvedValue({
      validateAddress: (...a: any[]) => mockValidateAddress(...a),
    });
  });

  it("returns true for a valid address", async () => {
    mockValidateAddress.mockResolvedValue(true);
    const result = await genericValidateAddress("xrp", "local")("rValidAddress", {});
    expect(result).toBe(true);
  });

  it("returns false for an invalid address", async () => {
    mockValidateAddress.mockResolvedValue(false);
    const result = await genericValidateAddress("xrp", "local")("invalid", {});
    expect(result).toBe(false);
  });

  it("resolves the API with parameters.currencyId when provided", async () => {
    mockValidateAddress.mockResolvedValue(true);
    await genericValidateAddress("evm", "local")("0xAddress", { currencyId: "ethereum" });
    expect(mockGetCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
  });

  it("falls back to network when parameters.currencyId is absent", async () => {
    mockValidateAddress.mockResolvedValue(true);
    await genericValidateAddress("stellar", "local")("GADDRESS", {});
    expect(mockGetCoinModuleApi).toHaveBeenCalledWith("stellar", "local");
  });

  it("propagates errors thrown by api.validateAddress", async () => {
    mockValidateAddress.mockRejectedValue(new Error("validation failed"));
    await expect(genericValidateAddress("evm", "local")("0xBad", {})).rejects.toThrow(
      "validation failed",
    );
  });

  it("falls back to the coin module of a network that names no known currency", async () => {
    mockValidateAddress.mockResolvedValue(true);
    await genericValidateAddress("evm", "local")("0xAddress", {});
    expect(isPortfolioEnabledFor).not.toHaveBeenCalled();
    expect(mockGetCoinModuleApi).toHaveBeenCalledWith("evm", "local");
  });

  describe("when the coin config of the currency enables the portfolio layer", () => {
    const validateAddress = jest.fn(async () => ({ valid: true }));

    beforeEach(() => {
      jest.mocked(isPortfolioEnabledFor).mockReturnValue(true);
      jest.mocked(openCurrencyPortfolio).mockResolvedValue({
        portfolio: { validateAddress },
        network: "xrp",
        mode: "local",
      } as never);
    });

    it("validates through the side writing for the chain, with the network id", async () => {
      validateAddress.mockResolvedValueOnce({ valid: false });

      await expect(
        genericValidateAddress("xrp", "local")("rAddress", { currencyId: "ripple", networkId: 2 }),
      ).resolves.toBe(false);

      expect(isPortfolioEnabledFor).toHaveBeenCalledWith("ripple");
      expect(openCurrencyPortfolio).toHaveBeenCalledWith(getCryptoCurrencyById("ripple"), "write");
      expect(validateAddress).toHaveBeenCalledWith("xrp", "rAddress", { networkId: 2 });
      expect(mockGetCoinModuleApi).not.toHaveBeenCalled();
    });

    it("resolves the currency of the network, and sends no parameters without a network id", async () => {
      await expect(genericValidateAddress("xrp", "local")("rAddress", {})).resolves.toBe(true);

      expect(isPortfolioEnabledFor).toHaveBeenCalledWith("ripple");
      expect(validateAddress).toHaveBeenCalledWith("xrp", "rAddress");
    });
  });
});
