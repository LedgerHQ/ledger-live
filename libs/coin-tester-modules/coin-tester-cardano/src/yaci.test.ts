import { resetDevnet, topup } from "./yaci";

// yaci.ts tears the devnet down on process exit; keep that from touching a real container.
jest.mock("docker-compose", () => ({ down: jest.fn().mockResolvedValue({}) }));

const ADDRESS = "addr_test1qrdevnet";
const fetchMock = jest.fn();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const utxo = (txHash: string, lovelace: string) => ({
  tx_hash: txHash,
  output_index: 0,
  amount: [{ unit: "lovelace", quantity: lovelace }],
});

const calls = (pathFragment: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes(pathFragment));

const realFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

describe("resetDevnet", () => {
  it("waits for the reset chain to produce a block", async () => {
    const heights = [-1, 0, 2];
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/admin/devnet/reset")
        ? new Response("done")
        : json({ height: heights.shift() }),
    );

    await resetDevnet();

    expect(calls("/admin/devnet/reset")).toHaveLength(1);
    expect(calls("/blocks/latest")).toHaveLength(3);
  });

  it("keeps polling while the store is unreachable", async () => {
    let storeUp = false;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/admin/devnet/reset")) return new Response("done");
      if (!storeUp) {
        storeUp = true;
        throw new TypeError("fetch failed");
      }
      return json({ height: 1 });
    });

    await expect(resetDevnet()).resolves.toBeUndefined();
  });

  it("does not re-send a reset after a transport error", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(resetDevnet()).rejects.toThrow("fetch failed");
    expect(calls("/admin/devnet/reset")).toHaveLength(1);
    expect(calls("/blocks/latest")).toHaveLength(0);
  });

  it("retries a reset the server answered with 5xx", async () => {
    const resets = [new Response("boom", { status: 500 }), new Response("done")];
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/admin/devnet/reset") ? resets.shift() : json({ height: 1 }),
    );

    await resetDevnet();

    expect(calls("/admin/devnet/reset")).toHaveLength(2);
  });
});

// The wall-clock bound is what releases a request whose AbortSignal is dropped (MSW passthrough), so
// these use fetches that never settle and ignore their signal.
describe("deadlines", () => {
  const never = () => new Promise<Response>(() => {});

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fails a reset that never answers, without re-sending it", async () => {
    fetchMock.mockImplementation(never);

    const assertion = expect(resetDevnet()).rejects.toThrow("timed out");
    await jest.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(calls("/admin/devnet/reset")).toHaveLength(1);
  });

  it("moves past a store response whose body never completes", async () => {
    const stalled = () => new Response(new ReadableStream({ start() {} }));
    const blocks = [stalled(), json({ height: 1 })];
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/admin/devnet/reset") ? new Response("done") : blocks.shift(),
    );

    const done = resetDevnet();
    await jest.advanceTimersByTimeAsync(5_000);
    await expect(done).resolves.toBeUndefined();

    expect(calls("/blocks/latest")).toHaveLength(2);
  });

  it("gives up when the reset chain never produces a block", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/admin/devnet/reset") ? new Response("done") : json({ height: -1 }),
    );

    const assertion = expect(resetDevnet()).rejects.toThrow("produced no block");
    await jest.advanceTimersByTimeAsync(40_000);
    await assertion;
  });
});

describe("topup", () => {
  it("resolves once the new funding UTXO is in the store", async () => {
    const snapshots = [[], [], [utxo("funding", "100000000")]];
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/addresses/topup") ? json({ status: true }) : json(snapshots.shift() ?? []),
    );

    await topup(ADDRESS, 100);

    expect(calls("/addresses/topup")).toHaveLength(1);
    expect(calls(`/addresses/${ADDRESS}/utxos`)).toHaveLength(3);
  });

  it("does not take a UTXO that existed before the top-up as confirmation", async () => {
    const existing = utxo("existing", "100000000");
    const snapshots = [[existing], [existing], [existing, utxo("funding", "100000000")]];
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/addresses/topup") ? json({ status: true }) : json(snapshots.shift() ?? []),
    );

    await topup(ADDRESS, 100);

    expect(calls(`/addresses/${ADDRESS}/utxos`)).toHaveLength(3);
  });

  it("reads an unknown address as having no UTXOs", async () => {
    const snapshots = [json({}, 404), json([utxo("funding", "1500000")])];
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/addresses/topup") ? json({ status: true }) : snapshots.shift(),
    );

    await expect(topup(ADDRESS, 1.5)).resolves.toBeUndefined();
  });
});
