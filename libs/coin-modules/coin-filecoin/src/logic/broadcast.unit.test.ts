import { broadcastTx } from "../api/api";
import { broadcast } from "./broadcast";

jest.mock("../api/api");

const mockedBroadcastTx = broadcastTx as jest.MockedFunction<typeof broadcastTx>;

const VALID_BROADCAST_REQUEST = {
  message: {
    version: 0,
    to: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
    from: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
    nonce: 5,
    value: "100000000000000000",
    gaslimit: 1000000,
    gasfeecap: "100000",
    gaspremium: "100000",
    method: 0,
    params: "",
  },
  signature: {
    type: 1,
    data: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  },
};

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses the JSON input and calls broadcastTx", async () => {
    const expectedHash = "bafy2bzacedpqzd6qm2r7nvxj5oetpqvhujwwmvkhz4u3xnfzdvwzxpjzuqhpa";
    mockedBroadcastTx.mockResolvedValueOnce({ hash: expectedHash });

    const result = await broadcast(JSON.stringify(VALID_BROADCAST_REQUEST));

    expect(mockedBroadcastTx).toHaveBeenCalledWith(VALID_BROADCAST_REQUEST);
    expect(result).toBe(expectedHash);
  });

  it("propagates errors from broadcastTx", async () => {
    mockedBroadcastTx.mockRejectedValueOnce(new Error("network error"));

    await expect(broadcast(JSON.stringify(VALID_BROADCAST_REQUEST))).rejects.toThrow(
      "network error",
    );
  });

  it("throws on invalid JSON input", async () => {
    await expect(broadcast("not-valid-json")).rejects.toThrow(SyntaxError);
  });
});
