import { fetchBlockHeight } from "../api/api";
import { lastBlock } from "./lastBlock";

jest.mock("../api/api");
jest.mock("@ledgerhq/logs");

const mockedFetchBlockHeight = fetchBlockHeight as jest.MockedFunction<typeof fetchBlockHeight>;

describe("lastBlock", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps current_block_identifier to BlockInfo", async () => {
    const ts = 1700000000;
    mockedFetchBlockHeight.mockResolvedValueOnce({
      current_block_identifier: { index: 3_000_000, hash: "bafy2bzacedXXX" },
      genesis_block_identifier: { index: 0, hash: "genesis" },
      current_block_timestamp: ts,
    });

    const result = await lastBlock();

    expect(result.height).toBe(3_000_000);
    expect(result.hash).toBe("bafy2bzacedXXX");
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBe(ts);
  });

  it("time is a Date not a number", async () => {
    mockedFetchBlockHeight.mockResolvedValueOnce({
      current_block_identifier: { index: 1, hash: "h" },
      genesis_block_identifier: { index: 0, hash: "g" },
      current_block_timestamp: 1_600_000_000,
    });

    const result = await lastBlock();
    expect(typeof result.time).toBe("object");
    expect(result.time instanceof Date).toBe(true);
  });
});
