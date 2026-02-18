import { apiClient } from "../network/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getBalance } from "./getBalance";

jest.mock("../network/api");

const mockGetAccountBalance = jest.mocked(apiClient.getAccountBalance);

describe("getBalance", () => {
  const mockCurrency = getMockedCurrency();
  const mockAccount = getMockedAccount();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return balance when account has funds", async () => {
    mockGetAccountBalance.mockResolvedValue("1000000u64");

    const result = await getBalance(mockCurrency, mockAccount.freshAddress);

    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt(1000000),
      },
    ]);
    expect(mockGetAccountBalance).toHaveBeenCalledTimes(1);
    expect(mockGetAccountBalance).toHaveBeenCalledWith(mockCurrency, mockAccount.freshAddress);
  });

  it("should handle zero balance", async () => {
    mockGetAccountBalance.mockResolvedValue("0u64");

    const result = await getBalance(mockCurrency, mockAccount.freshAddress);

    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt(0),
      },
    ]);
  });

  it("should handle large balance values", async () => {
    mockGetAccountBalance.mockResolvedValue("999999999999999999u64");

    const result = await getBalance(mockCurrency, mockAccount.freshAddress);

    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt("999999999999999999"),
      },
    ]);
  });

  it("should parse balance correctly by removing last 3 characters (u64)", async () => {
    mockGetAccountBalance.mockResolvedValue("123456789u64");

    const result = await getBalance(mockCurrency, mockAccount.freshAddress);

    expect(result).toEqual([
      {
        asset: { type: "native" },
        value: BigInt(123456789),
      },
    ]);
  });

  it("should return empty array when API returns null", async () => {
    mockGetAccountBalance.mockResolvedValue(null);

    const result = await getBalance(mockCurrency, mockAccount.freshAddress);

    expect(result).toEqual([]);
  });

  it("should throw error when balance format is invalid (missing u64)", async () => {
    mockGetAccountBalance.mockResolvedValue("1000000");

    await expect(getBalance(mockCurrency, mockAccount.freshAddress)).rejects.toThrow();
  });

  it("should throw error when balance format has wrong suffix", async () => {
    mockGetAccountBalance.mockResolvedValue("1000000u32");

    await expect(getBalance(mockCurrency, mockAccount.freshAddress)).rejects.toThrow();
  });

  it("should throw error when balance format is completely invalid", async () => {
    mockGetAccountBalance.mockResolvedValue("invalid");

    await expect(getBalance(mockCurrency, mockAccount.freshAddress)).rejects.toThrow();
  });
});
