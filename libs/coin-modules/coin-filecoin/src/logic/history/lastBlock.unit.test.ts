import { fetchBlockHeight } from "../../network/api";
import { lastBlock } from "./lastBlock";

jest.mock("../../network/api");
jest.mock("@ledgerhq/logs");

const mockedFetchBlockHeight = fetchBlockHeight as jest.MockedFunction<typeof fetchBlockHeight>;

describe("lastBlock", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps current_block_identifier to BlockInfo", async () => {
    // API returns millisecond timestamps
    const tsMs = 1700000000000;
    mockedFetchBlockHeight.mockResolvedValueOnce({
      current_block_identifier: { index: 3_000_000, hash: "bafy2bzacedXXX" },
      genesis_block_identifier: { index: 0, hash: "genesis" },
      current_block_timestamp: tsMs,
    });

    const result = await lastBlock();

    expect(result.height).toBe(3_000_000);
    expect(result.hash).toBe("bafy2bzacedXXX");
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.getTime()).toBe(tsMs);
    // Verify the date is reasonable (not 1970)
    expect(result.time.getFullYear()).toBeGreaterThan(2020);
  });
});
