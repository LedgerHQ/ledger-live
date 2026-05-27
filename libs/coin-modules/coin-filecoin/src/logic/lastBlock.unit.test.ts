import { fetchBlockHeight } from "../api/api";
import { TEST_BLOCK_HEIGHTS } from "../test/fixtures";
import { lastBlock } from "./lastBlock";

jest.mock("../api/api");

const mockedFetchBlockHeight = fetchBlockHeight as jest.MockedFunction<typeof fetchBlockHeight>;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps NetworkStatusResponse to BlockInfo", async () => {
    const timestamp = 1_700_000_000;
    mockedFetchBlockHeight.mockResolvedValueOnce({
      current_block_identifier: {
        index: TEST_BLOCK_HEIGHTS.CURRENT,
        hash: "bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa",
      },
      genesis_block_identifier: { index: 0, hash: "genesis" },
      current_block_timestamp: timestamp,
    });

    const result = await lastBlock();

    expect(result.height).toBe(TEST_BLOCK_HEIGHTS.CURRENT);
    expect(result.hash).toBe("bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa");
    expect(result.time).toEqual(new Date(timestamp * 1000));
  });

  it("propagates errors from fetchBlockHeight", async () => {
    mockedFetchBlockHeight.mockRejectedValueOnce(new Error("network unavailable"));

    await expect(lastBlock()).rejects.toThrow("network unavailable");
  });
});
