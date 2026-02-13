jest.mock("../../api");

import { fetchAccountTransactions } from "../../api";
import { getTransactions } from "./getTransactions";

const mockFetchAccountTransactions = fetchAccountTransactions as jest.MockedFunction<
  typeof fetchAccountTransactions
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
    ] as any);

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
