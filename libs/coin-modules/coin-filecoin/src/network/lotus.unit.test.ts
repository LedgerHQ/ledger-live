import network from "@ledgerhq/live-network";
import { fetchFinalizedHeight } from "./lotus";

jest.mock("@ledgerhq/live-network");

const mockedNetwork = jest.mocked(network);
const NODE_URL = "https://mock.lotus/rpc/v2";

function answer(data: unknown) {
  mockedNetwork.mockResolvedValueOnce({ data } as Awaited<ReturnType<typeof network>>);
}

describe("fetchFinalizedHeight", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns the height of the finalized tipset", async () => {
    answer({
      jsonrpc: "2.0",
      id: 1,
      result: { Height: 6582170, Cids: [{ "/": "bafy2bzacefinalized" }], Blocks: [] },
    });

    await expect(fetchFinalizedHeight(NODE_URL)).resolves.toBe(6582170);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: NODE_URL,
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "Filecoin.ChainGetTipSet",
        params: [{ tag: "finalized" }],
      },
    });
  });

  it("throws the JSON-RPC error of the node", async () => {
    answer({ jsonrpc: "2.0", id: 1, error: { code: -32601, message: "method not found" } });

    await expect(fetchFinalizedHeight(NODE_URL)).rejects.toThrow(
      "Lotus Filecoin.ChainGetTipSet failed: method not found (code -32601)",
    );
  });
});
