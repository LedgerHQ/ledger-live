const createApi = jest.fn((..._args: unknown[]) => ({ api: true }));
jest.mock("@ledgerhq/coin-bitcoin/api", () => ({
  createApi: (...args: unknown[]) => createApi(...args),
}));
const walletBtcCurrencyById = jest.fn();
jest.mock("@ledgerhq/coin-bitcoin/walletBtcCurrency", () => ({
  walletBtcCurrencyById: (...args: unknown[]) => walletBtcCurrencyById(...args),
}));
jest.mock("../../config", () => ({
  getCurrencyConfiguration: jest.fn((id: string) => ({ configOf: id })),
}));

import { createLocalBitcoinApi } from "./coinModuleApi";

beforeEach(() => jest.clearAllMocks());

describe("createLocalBitcoinApi", () => {
  it("builds the coin module API on the explorer of the currency's configuration", () => {
    walletBtcCurrencyById.mockReturnValueOnce({
      explorerEndpoint: "https://explorer",
      explorerId: "btc",
    });
    expect(createLocalBitcoinApi("bitcoin")).toEqual({ api: true });
    expect(walletBtcCurrencyById).toHaveBeenCalledWith("bitcoin", { configOf: "bitcoin" });
    expect(createApi).toHaveBeenCalledWith(
      { explorerEndpoint: "https://explorer", explorerId: "btc" },
      "bitcoin",
    );
  });
});
