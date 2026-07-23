import { apiClient } from "../network/api";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { lastBlock } from "./lastBlock";

jest.mock("../network/api");

const mockGetLatestBlock = jest.mocked(apiClient.getLatestBlock);

describe("lastBlock", () => {
  const mockConfig = getMockedConfig("mainnet");

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

    const result = await lastBlock(mockConfig);

    expect(mockGetLatestBlock).toHaveBeenCalledTimes(1);
    expect(mockGetLatestBlock).toHaveBeenCalledWith(mockConfig);
    expect(result).toEqual({
      height: 1234567,
      hash: "ab1234567890",
      time: new Date(mockBlockResponse.header.metadata.timestamp * 1000),
    });
  });
});
