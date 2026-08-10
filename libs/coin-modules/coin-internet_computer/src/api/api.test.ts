import { broadcastTxn } from "./api";

describe("broadcastTxn endpoint routing", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("submits call to /api/v3 and read_state to /api/v2", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ status: 200, arrayBuffer: async () => new ArrayBuffer(0) });
    (global as any).fetch = fetchMock;

    const canisterId = "ryjl3-tyaaa-aaaaa-aaaba-cai";
    await broadcastTxn(Buffer.from("00", "hex"), canisterId, "call");
    await broadcastTxn(Buffer.from("00", "hex"), canisterId, "read_state");

    expect(fetchMock.mock.calls[0][0]).toContain(`/api/v3/canister/${canisterId}/call`);
    expect(fetchMock.mock.calls[1][0]).toContain(`/api/v2/canister/${canisterId}/read_state`);
  });
});
