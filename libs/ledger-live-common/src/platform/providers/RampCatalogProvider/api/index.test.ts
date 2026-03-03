import { getEnv } from "@ledgerhq/live-env";
import api from "./index";
import type { CurrenciesPerProvider, RampCatalog } from "../types";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((key: string) => {
    if (key === "MOCK") return false;
    if (key === "BUY_API_BASE") return "https://buy.example.com";
    if (key === "SELL_API_BASE") return "https://sell.example.com";
    return "";
  }),
}));

const mockGetEnv = jest.mocked(getEnv);

// Must require after mocks to get the mocked network
const network = jest.requireMock("@ledgerhq/live-network").default;

const buyCatalog: RampCatalog = {
  onRamp: { moonpay: ["bitcoin", "ethereum"] },
  offRamp: { moonpay: ["bitcoin"] },
};

const sellCatalog: CurrenciesPerProvider = {
  coinify: ["bitcoin", "ethereum"],
};

describe("RampCatalogProvider API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockImplementation((key: string) => {
      if (key === "MOCK") return false;
      if (key === "BUY_API_BASE") return "https://buy.example.com";
      if (key === "SELL_API_BASE") return "https://sell.example.com";
      return "";
    });
  });

  it("returns combined catalog when both buy and sell succeed", async () => {
    network
      .mockResolvedValueOnce({ data: buyCatalog })
      .mockResolvedValueOnce({ data: sellCatalog });

    const result = await api.fetchRampCatalog();

    expect(result).toEqual({
      onRamp: buyCatalog.onRamp,
      offRamp: sellCatalog,
    });
  });

  it("returns onRamp from buy and empty offRamp when sell fails", async () => {
    network
      .mockResolvedValueOnce({ data: buyCatalog })
      .mockRejectedValueOnce(new Error("Sell API unavailable"));

    const result = await api.fetchRampCatalog();

    expect(result).toEqual({
      onRamp: buyCatalog.onRamp,
      offRamp: {},
    });
  });

  it("returns empty onRamp and sell offRamp when buy fails", async () => {
    network
      .mockRejectedValueOnce(new Error("Buy API unavailable"))
      .mockResolvedValueOnce({ data: sellCatalog });

    const result = await api.fetchRampCatalog();

    expect(result).toEqual({
      onRamp: {},
      offRamp: sellCatalog,
    });
  });

  it("throws when both buy and sell fail", async () => {
    network
      .mockRejectedValueOnce(new Error("Buy API unavailable"))
      .mockRejectedValueOnce(new Error("Sell API unavailable"));

    await expect(api.fetchRampCatalog()).rejects.toThrow(
      "Failed to fetch ramp catalog from both buy and sell APIs",
    );
  });

  it("returns mock data when MOCK env is true", async () => {
    mockGetEnv.mockImplementation((key: string) => (key === "MOCK" ? true : ""));

    const result = await api.fetchRampCatalog();

    expect(network).not.toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.onRamp).toBeDefined();
    expect(result.offRamp).toBeDefined();
  });
});
