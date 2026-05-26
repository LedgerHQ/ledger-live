import { getBalance } from "./getBalance";
import { fetchBalances, fetchERC20TokenBalance } from "../../api/api";

jest.mock("../../api/api");
const mockedFetchBalances = jest.mocked(fetchBalances);
const mockedFetchERC20TokenBalance = jest.mocked(fetchERC20TokenBalance);

describe("getBalance", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns native Balance with spendable_balance", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "5000000000000000000",
      locked_balance: "1000000000000000000",
      total_balance: "6000000000000000000",
    });

    const result = await getBalance("f1abc");
    expect(result).toHaveLength(1);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(result[0].value).toBe(5000000000000000000n);
    expect(result[0].locked).toBe(1000000000000000000n);
  });

  it("handles missing locked_balance gracefully", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "100",
      total_balance: "100",
    } as any);

    const result = await getBalance("f1xyz");
    expect(result[0].locked).toBe(0n);
  });

  it("returns token balances when tokenContracts provided", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "1000",
      locked_balance: "0",
      total_balance: "1000",
    });
    mockedFetchERC20TokenBalance.mockResolvedValue("500");

    const result = await getBalance("f1abc", ["0xContractA"]);

    expect(result).toHaveLength(2);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(result[1].asset).toEqual({ type: "token", assetReference: "0xcontracta" });
    expect(result[1].value).toBe(500n);
  });

  it("returns zero-balance token entries instead of omitting them", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "1000",
      locked_balance: "0",
      total_balance: "1000",
    });
    mockedFetchERC20TokenBalance.mockResolvedValue("0");

    const result = await getBalance("f1abc", ["0xToken"]);

    expect(result).toHaveLength(2);
    expect(result[1].value).toBe(0n);
  });

  it("returns zero for token when API call fails", async () => {
    mockedFetchBalances.mockResolvedValue({
      spendable_balance: "1000",
      locked_balance: "0",
      total_balance: "1000",
    });
    mockedFetchERC20TokenBalance.mockRejectedValue(new Error("API error"));

    const result = await getBalance("f1abc", ["0xBroken"]);

    expect(result).toHaveLength(2);
    expect(result[1].value).toBe(0n);
  });
});
