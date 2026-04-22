jest.mock("../../network");

import { DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import { fetchAccountTransactions } from "../../network";
import { getTransactions } from "./getTransactions";

const mockFetchAccountTransactions = fetchAccountTransactions as jest.MockedFunction<
  DeepPartialReturn<typeof fetchAccountTransactions>
>;

describe("getTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return transactions sorted by timestamp descending", async () => {
    mockFetchAccountTransactions.mockResolvedValue([
      { timestamp: 100 },
      { timestamp: 300 },
      { timestamp: 200 },
    ]);

    const result = await getTransactions("B62qtest");

    expect(result[0].timestamp).toBe(300);
    expect(result[1].timestamp).toBe(200);
    expect(result[2].timestamp).toBe(100);
  });

  it("should pass offset to fetchAccountTransactions", async () => {
    mockFetchAccountTransactions.mockResolvedValue([]);

    await getTransactions("B62qtest", 10);

    expect(mockFetchAccountTransactions).toHaveBeenCalledWith("B62qtest", 10);
  });
});
