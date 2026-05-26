import { lastBlock } from "./lastBlock";
import { fetchBlockHeight } from "../../api/api";

jest.mock("../../api/api");
const mockedFetchBlockHeight = jest.mocked(fetchBlockHeight);

describe("lastBlock", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns BlockInfo from network status", async () => {
    mockedFetchBlockHeight.mockResolvedValue({
      current_block_identifier: { index: 123456, hash: "bafy2abc" },
      genesis_block_identifier: { index: 0, hash: "bafy2gen" },
      current_block_timestamp: 1700000000,
    });

    const result = await lastBlock();
    expect(result.height).toBe(123456);
    expect(result.hash).toBe("bafy2abc");
    expect(result.time).toEqual(new Date(1700000000 * 1000));
  });

  it("returns a valid Date for time", async () => {
    mockedFetchBlockHeight.mockResolvedValue({
      current_block_identifier: { index: 1, hash: "h" },
      genesis_block_identifier: { index: 0, hash: "g" },
      current_block_timestamp: 1716000000,
    });

    const result = await lastBlock();
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBeGreaterThan(0);
  });
});
