import { getCurrencyConfiguration } from "../../../../config";
import { resolveCurrencyConfig } from "../resolveCurrencyConfig";

jest.mock("../../../../config", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

const mockGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);

describe("resolveCurrencyConfig", () => {
  const config = {
    status: { type: "active" as const },
    name: "Ethereum",
    unit: { name: "ether", code: "ETH", magnitude: 18 },
    chainId: 1,
  };

  beforeEach(() => {
    mockGetCurrencyConfiguration.mockReset();
  });

  it("returns undefined when the network id is missing", () => {
    expect(resolveCurrencyConfig(undefined)).toBeUndefined();
    expect(mockGetCurrencyConfiguration).not.toHaveBeenCalled();
  });

  it("resolves the config of the network", () => {
    mockGetCurrencyConfiguration.mockReturnValue(config);

    expect(resolveCurrencyConfig("ethereum")).toEqual(config);
    expect(mockGetCurrencyConfiguration).toHaveBeenCalledWith("ethereum");
  });

  it("resolves the config of the parent network of a token id", () => {
    mockGetCurrencyConfiguration.mockReturnValue(config);

    expect(resolveCurrencyConfig("ethereum/erc20/usd-tether")).toEqual(config);
    expect(mockGetCurrencyConfiguration).toHaveBeenCalledWith("ethereum");
  });

  it("warns and returns undefined when the network has no config entry", () => {
    const error = new Error("No currency configuration available for aptos");
    mockGetCurrencyConfiguration.mockImplementation(() => {
      throw error;
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(resolveCurrencyConfig("aptos")).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(error);

    warn.mockRestore();
  });
});
