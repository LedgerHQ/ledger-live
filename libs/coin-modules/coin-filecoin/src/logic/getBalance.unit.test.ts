import { fetchBalances } from "../api/api";
import { createMockBalanceResponse, TEST_ADDRESSES } from "../test/fixtures";
import { getBalance } from "./getBalance";

jest.mock("../api/api");

const mockedFetchBalances = fetchBalances as jest.MockedFunction<typeof fetchBalances>;

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a single native balance entry", async () => {
    mockedFetchBalances.mockResolvedValueOnce(
      createMockBalanceResponse({
        total_balance: "2000000000000000000",
        locked_balance: "500000000000000000",
        spendable_balance: "1500000000000000000",
      }),
    );

    const result = await getBalance(TEST_ADDRESSES.F1_ADDRESS);

    expect(result).toHaveLength(1);
    expect(result[0].asset.type).toBe("native");
    expect(result[0].value).toBe(2_000_000_000_000_000_000n);
    expect(result[0].locked).toBe(500_000_000_000_000_000n);
  });

  it("returns zero locked when locked_balance is zero", async () => {
    mockedFetchBalances.mockResolvedValueOnce(
      createMockBalanceResponse({
        total_balance: "1000000000000000000",
        locked_balance: "0",
        spendable_balance: "1000000000000000000",
      }),
    );

    const result = await getBalance(TEST_ADDRESSES.F1_ADDRESS);

    expect(result[0].locked).toBe(0n);
  });
});
