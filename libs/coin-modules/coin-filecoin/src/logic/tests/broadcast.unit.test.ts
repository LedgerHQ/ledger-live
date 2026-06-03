import { broadcastTx } from "../../api/api";
import { broadcast } from "../broadcast";

jest.mock("../../api/api");
jest.mock("@ledgerhq/logs");

const mockedBroadcastTx = broadcastTx as jest.MockedFunction<typeof broadcastTx>;

const VALID_REQUEST = JSON.stringify({
  message: {
    version: 0,
    to: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
    from: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
    nonce: 1,
    value: "1000000",
    gaslimit: 1000000,
    gasfeecap: "100000",
    gaspremium: "1000",
    method: 0,
    params: "",
  },
  signature: { type: 1, data: "c2lnbmF0dXJl" },
});

describe("broadcast", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns hash string on success", async () => {
    mockedBroadcastTx.mockResolvedValueOnce({
      hash: "bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa",
    });

    const result = await broadcast(VALID_REQUEST);
    expect(result).toBe("bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa");
  });

  it("throws when hash is empty string", async () => {
    mockedBroadcastTx.mockResolvedValueOnce({ hash: "" });

    await expect(broadcast(VALID_REQUEST)).rejects.toThrow(/empty transaction hash/);
  });

  it("propagates API errors", async () => {
    mockedBroadcastTx.mockRejectedValueOnce(new Error("network failure"));

    await expect(broadcast(VALID_REQUEST)).rejects.toThrow("network failure");
  });
});
