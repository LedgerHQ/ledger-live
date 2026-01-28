import { lastBlock } from "./lastBlock";
import { fetchBlockHeight } from "../network/api";

jest.mock("../network/api");

const mockedFetchBlockHeight = fetchBlockHeight as jest.MockedFunction<typeof fetchBlockHeight>;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return BlockInfo with current height and hash", async () => {
    mockedFetchBlockHeight.mockResolvedValueOnce({
      current_block_identifier: {
        index: 3000000,
        hash: "blockhash123",
      },
      genesis_block_identifier: {
        index: 0,
        hash: "genesis",
      },
      current_block_timestamp: Date.now(),
    });

    const result = await lastBlock();

    expect(result).toEqual({
      height: 3000000,
      hash: "blockhash123",
    });
  });

  it("should propagate network errors", async () => {
    mockedFetchBlockHeight.mockRejectedValueOnce(new Error("Network error"));

    await expect(lastBlock()).rejects.toThrow("Network error");
  });
});
