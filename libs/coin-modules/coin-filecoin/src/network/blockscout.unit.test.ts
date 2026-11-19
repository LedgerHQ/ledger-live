import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
import network from "@ledgerhq/live-network";
import { fetchBlockscoutBlock } from "./blockscout";

jest.mock("@ledgerhq/live-network");

const mockedNetwork = jest.mocked(network);
const INDEXER_URL = "https://mock.blockscout/api/v2";

describe("fetchBlockscoutBlock", () => {
  beforeEach(() => jest.resetAllMocks());

  it("requests the block by height", async () => {
    const block = { height: 6558811, hash: "0xaa", parent_hash: "0xbb", timestamp: "2026-11-18" };
    mockedNetwork.mockResolvedValueOnce({ data: block } as Awaited<ReturnType<typeof network>>);

    await expect(fetchBlockscoutBlock(INDEXER_URL, 6558811)).resolves.toEqual(block);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${INDEXER_URL}/blocks/6558811`,
    });
  });

  it("requests the block by hash", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: {} } as Awaited<ReturnType<typeof network>>);

    await fetchBlockscoutBlock(INDEXER_URL, "0xaa");

    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${INDEXER_URL}/blocks/0xaa`,
    });
  });

  it("turns a 404 into a BlockNotFoundError", async () => {
    mockedNetwork.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), { name: "LedgerAPI4xx", status: 404 }),
    );

    await expect(fetchBlockscoutBlock(INDEXER_URL, 2683340)).rejects.toBeInstanceOf(
      BlockNotFoundError,
    );
  });

  it("rethrows a 404 that does not come from the network layer", async () => {
    const failure = Object.assign(new Error("Not found"), { status: 404 });
    mockedNetwork.mockRejectedValueOnce(failure);

    await expect(fetchBlockscoutBlock(INDEXER_URL, 6558811)).rejects.toBe(failure);
  });

  it("rethrows any other error", async () => {
    const failure = Object.assign(new Error("Bad gateway"), { status: 502 });
    mockedNetwork.mockRejectedValueOnce(failure);

    await expect(fetchBlockscoutBlock(INDEXER_URL, 6558811)).rejects.toBe(failure);
  });
});
