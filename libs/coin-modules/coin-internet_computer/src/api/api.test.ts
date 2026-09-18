import { ICPNodeRefused } from "../errors";
import { broadcastTxn } from "./api";

// A node answering every submission with the given status.
const answering = (status: number, text = "") => {
  (global as any).fetch = jest.fn().mockResolvedValue({
    status,
    arrayBuffer: async () => new Uint8Array([1]).buffer,
    text: async () => text,
  });
};

const submit = () => broadcastTxn(Buffer.from("00", "hex"), "ryjl3-tyaaa-aaaaa-aaaba-cai", "call");

describe("broadcastTxn answers", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the body of a certified answer", async () => {
    answering(200);
    await expect(submit()).resolves.toEqual(new Uint8Array([1]));
  });

  // Not a failure: the node took the call, and it may still execute. The caller polls or reports the
  // outcome unknown; it must not report a transaction that never happened.
  it("returns null when the node took the call without certifying it", async () => {
    answering(202);
    await expect(submit()).resolves.toBeNull();
  });

  it("returns null when the node failed to answer", async () => {
    answering(503, "upstream unavailable");
    await expect(submit()).resolves.toBeNull();
  });

  // The one answer that settles it: the message was never taken, so a retry repeats nothing.
  it("throws a refusal carrying the node's status when the node would not take the call", async () => {
    answering(403, "ingress expiry too far in the past");
    const attempt = submit();
    await expect(attempt).rejects.toThrow(ICPNodeRefused);
    await expect(attempt).rejects.toThrow(/ingress expiry/);
    await expect(attempt).rejects.toMatchObject({ status: 403 });
  });
});

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
