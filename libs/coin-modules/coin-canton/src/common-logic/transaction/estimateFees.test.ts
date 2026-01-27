import * as coinConfigModule from "../../config";
import { createMockCantonCurrency, createMockCoinConfigValue } from "../../test/fixtures";
import { estimateFees } from "./estimateFees";

const mockCurrency = createMockCantonCurrency();
const magnitude: bigint = 10n ** 38n;
const createMockConfigWithFee = (fee: number | undefined): coinConfigModule.CantonCoinConfig => ({
  ...createMockCoinConfigValue(),
  fee,
});

describe("estimateFees", () => {
  const mockGetCoinConfig = jest.spyOn(coinConfigModule.default, "getCoinConfig");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 2 CC fees for 100 CC", async () => {
    mockGetCoinConfig.mockReturnValue(createMockConfigWithFee(undefined));

    const result = await estimateFees(mockCurrency, 100n * magnitude);

    // 2 CC
    expect(result).toEqual(2n * magnitude);
  });

  it("returns 11 CC fees for 1000 CC", async () => {
    mockGetCoinConfig.mockReturnValue(createMockConfigWithFee(undefined));

    const result = await estimateFees(mockCurrency, 1000n * magnitude);

    // 11 CC
    expect(result).toEqual(11n * magnitude);
  });

  it("returns forced fees when setup in config", async () => {
    mockGetCoinConfig.mockReturnValue(createMockConfigWithFee(3));

    const result = await estimateFees(mockCurrency, 1000n * magnitude);

    // 3 CC
    expect(result).toEqual(3n * magnitude);
  });

  it("returns forced fees when 0 is setup in config", async () => {
    mockGetCoinConfig.mockReturnValue(createMockConfigWithFee(0));

    const result = await estimateFees(mockCurrency, 1000n * magnitude);

    expect(result).toEqual(0n);
  });
});
