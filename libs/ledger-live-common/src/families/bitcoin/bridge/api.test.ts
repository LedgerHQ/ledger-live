import network from "@ledgerhq/live-network";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getBitcoinCoinConfig } from "../coinConfig";
import { getFeeItems } from "./api";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../coinConfig", () => ({
  getBitcoinCoinConfig: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);
const mockedGetBitcoinCoinConfig = jest.mocked(getBitcoinCoinConfig);

const configWith = (url: string, explorerId = "btc"): BitcoinCoinConfig => ({
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorerId,
  explorer: { url },
});

describe("getFeeItems", () => {
  // Each test uses its own currency so the module-level fee-rate cache starts cold.
  beforeEach(() => {
    mockedNetwork.mockReset();
    mockedNetwork.mockResolvedValue({
      data: { "1": 3000, "3": 2000, "6": 1000 },
      status: 200,
    } as any);
  });

  it("serves cached fee rates while the explorer is unchanged", async () => {
    const currency = getCryptoCurrencyById("litecoin");
    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://first.test.invalid", "ltc"));

    await getFeeItems(currency);
    await getFeeItems(currency);

    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("fetches from the new explorer when its endpoint changes with an unchanged TTL", async () => {
    const currency = getCryptoCurrencyById("dogecoin");
    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://first.test.invalid", "doge"));
    await getFeeItems(currency);

    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://second.test.invalid", "doge"));
    await getFeeItems(currency);

    expect(mockedNetwork).toHaveBeenCalledTimes(2);
    expect(mockedNetwork).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: "https://second.test.invalid/blockchain/v4/doge/fees" }),
    );
  });

  it("returns the default fee rate for the medium block target", async () => {
    mockedGetBitcoinCoinConfig.mockReturnValue(configWith("https://explorer.test.invalid"));

    const { defaultFeePerByte, items } = await getFeeItems(getCryptoCurrencyById("bitcoin"));

    expect(defaultFeePerByte.toNumber()).toBe(2);
    expect(items.map(item => item.speed)).toEqual(["fast", "medium", "slow"]);
  });
});
