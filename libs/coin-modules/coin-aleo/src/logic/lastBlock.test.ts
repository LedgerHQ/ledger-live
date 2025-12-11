import { apiClient } from "../network/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { lastBlock } from "./lastBlock";

jest.mock("../network/api");

const mockGetLatestBlock = apiClient.getLatestBlock as jest.MockedFunction<
  typeof apiClient.getLatestBlock
>;

describe("lastBlock", () => {
  const mockCurrency = getMockedCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and transform latest block info", async () => {
    const mockBlockResponse = {
      block_hash: "ab1234567890",
      previous_hash: "ab0987654321",
      header: {
        metadata: {
          height: 1234567,
          timestamp: new Date("2024-01-01T00:00:00.000Z").getTime() / 1000,
        },
      },
    };

    mockGetLatestBlock.mockResolvedValue(mockBlockResponse);

    const result = await lastBlock(mockCurrency);

    expect(mockGetLatestBlock).toHaveBeenCalledTimes(1);
    expect(mockGetLatestBlock).toHaveBeenCalledWith(mockCurrency);
    expect(result).toEqual({
      height: 1234567,
      hash: "ab1234567890",
      time: new Date(mockBlockResponse.header.metadata.timestamp * 1000),
    });
  });
});
