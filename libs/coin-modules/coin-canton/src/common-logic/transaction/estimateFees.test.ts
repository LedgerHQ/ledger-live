import { estimateFees } from "./estimateFees";
import * as coinConfigModule from "../../config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

const magnitude: bigint = 10n ** 38n;

describe("estimateFees", () => {
  const mockGetCoinConfig = jest.spyOn(coinConfigModule.default, "getCoinConfig");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 2 CC fees for 100 CC", async () => {
    mockGetCoinConfig.mockReturnValue({
      fee: undefined,
    } as unknown as coinConfigModule.CantonCoinConfig);

    const result = await estimateFees(mockCurrency, 100n * magnitude);

    // 2 CC
    expect(result).toEqual(2n * magnitude);
  });

  it("returns 11 CC fees for 1000 CC", async () => {
    mockGetCoinConfig.mockReturnValue({
      fee: undefined,
    } as unknown as coinConfigModule.CantonCoinConfig);

    const result = await estimateFees(mockCurrency, 1000n * magnitude);

    // 11 CC
    expect(result).toEqual(11n * magnitude);
  });

  it("returns forced fees when setup in config", async () => {
    mockGetCoinConfig.mockReturnValue({
      fee: 3,
    } as unknown as coinConfigModule.CantonCoinConfig);

    const result = await estimateFees(mockCurrency, 1000n * magnitude);

    // 3 CC
    expect(result).toEqual(3n * magnitude);
  });
});
