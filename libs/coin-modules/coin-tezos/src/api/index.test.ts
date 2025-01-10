import { createApi } from "./index";

const mockGetTransactions = jest.fn();
jest.mock("../logic/listOperations", () => ({
  listOperations: () => mockGetTransactions(),
}));

describe("get operations", () => {
  it("operations", async () => {
    const api = createApi({
      baker: {
        url: "https://baker.example.com",
      },
      explorer: {
        url: "foo",
        maxTxQuery: 1,
      },
      node: {
        url: "bar",
      },
      fees: {
        minGasLimit: 1,
        minRevealGasLimit: 1,
        minStorageLimit: 1,
        minFees: 1,
        minEstimatedFees: 2,
      },
    });

    mockGetTransactions.mockResolvedValue([]);

    // When
    const operations = await api.listOperations("addr", { limit: 100 });

    // Then
    expect(operations).toEqual([]);
  });
});
