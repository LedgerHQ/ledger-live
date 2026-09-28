import { apiClient } from "../network/api";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getPublicBalance } from "./getPublicBalance";

jest.mock("../network/api");

const mockGetAccountBalance = jest.mocked(apiClient.getAccountBalance);

describe("getPublicBalance", () => {
  const mockConfig = getMockedConfig("mainnet");
  const mockAccount = getMockedAccount();
  const HEIGHT = 19918276;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return balance when account has funds", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "1000000u64", height: HEIGHT });

    const result = await getPublicBalance(mockConfig, mockAccount.freshAddress);

    expect(result).toEqual({
      balances: [
        {
          asset: { type: "native" },
          value: BigInt(1000000),
        },
      ],
      height: HEIGHT,
    });
    expect(mockGetAccountBalance).toHaveBeenCalledTimes(1);
    expect(mockGetAccountBalance).toHaveBeenCalledWith(mockConfig, mockAccount.freshAddress);
  });

  it("should handle zero balance", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "0u64", height: HEIGHT });

    const result = await getPublicBalance(mockConfig, mockAccount.freshAddress);

    expect(result).toEqual({
      balances: [
        {
          asset: { type: "native" },
          value: BigInt(0),
        },
      ],
      height: HEIGHT,
    });
  });

  it("should handle large balance values", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "999999999999999999u64", height: HEIGHT });

    const result = await getPublicBalance(mockConfig, mockAccount.freshAddress);

    expect(result).toEqual({
      balances: [
        {
          asset: { type: "native" },
          value: BigInt("999999999999999999"),
        },
      ],
      height: HEIGHT,
    });
  });

  it("should parse balance correctly by removing last 3 characters (u64)", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "123456789u64", height: HEIGHT });

    const result = await getPublicBalance(mockConfig, mockAccount.freshAddress);

    expect(result).toEqual({
      balances: [
        {
          asset: { type: "native" },
          value: BigInt(123456789),
        },
      ],
      height: HEIGHT,
    });
  });

  it("should return empty array when API returns null", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: null, height: HEIGHT });

    const result = await getPublicBalance(mockConfig, mockAccount.freshAddress);

    expect(result).toEqual({ balances: [], height: HEIGHT });
  });

  it("should throw error when balance format is invalid (missing u64)", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "1000000", height: HEIGHT });

    await expect(getPublicBalance(mockConfig, mockAccount.freshAddress)).rejects.toThrow();
  });

  it("should parse balance with u32 suffix", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "1000000u32", height: HEIGHT });

    const result = await getPublicBalance(mockConfig, mockAccount.freshAddress);

    expect(result).toEqual({
      balances: [
        {
          asset: { type: "native" },
          value: BigInt(1000000),
        },
      ],
      height: HEIGHT,
    });
  });

  it("should throw error when balance format has incomplete unit suffix", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "1000000u", height: HEIGHT });

    await expect(getPublicBalance(mockConfig, mockAccount.freshAddress)).rejects.toThrow();
  });

  it("should throw error when balance format is completely invalid", async () => {
    mockGetAccountBalance.mockResolvedValue({ data: "invalid", height: HEIGHT });

    await expect(getPublicBalance(mockConfig, mockAccount.freshAddress)).rejects.toThrow();
  });
});
