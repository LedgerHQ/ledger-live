import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { adminGet, resetDevnet, spawnYaci, topup, YACI_STORE_API } from "./yaci";

const mockUpOne = jest.fn();
const mockDown = jest.fn();

// yaci.ts tears the devnet down on process exit; keep that from touching a real container.
jest.mock("docker-compose", () => ({
  down: (...args: unknown[]) => mockDown(...args),
  upOne: (...args: unknown[]) => mockUpOne(...args),
}));

type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;
const mockExecFile = jest.fn();
jest.mock("child_process", () => ({
  ...jest.requireActual("child_process"),
  execFile: (...args: unknown[]) => mockExecFile(...args),
}));
// Answers `docker compose logs` through execFile's trailing callback.
const logsAnswer =
  (error: Error | null, stdout: string, stderr = "") =>
  (...args: unknown[]) =>
    (args[args.length - 1] as ExecFileCallback)(error, stdout, stderr);

const CONTAINER_LOGS = "Waiting for node socket file to be created ...";

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

const warnings = () => jest.mocked(console.warn).mock.calls.map(([message]) => String(message));

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  mockExecFile.mockReset().mockImplementation(logsAnswer(null, CONTAINER_LOGS));
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

  it("does not retry a reset the server rejected with 4xx", async () => {
    fetchMock.mockResolvedValue(new Response("bad", { status: 400 }));

    await expect(resetDevnet()).rejects.toThrow("400");
    expect(calls("/admin/devnet/reset")).toHaveLength(1);
    expect(calls("/blocks/latest")).toHaveLength(0);
  });
});

// A reset can leave the new chain at height -1 for good; the block wait then needs fake time.
describe("resetDevnet on a stuck chain", () => {
  let resets = 0;

  // The chain produces blocks from the `healthyFrom`-th reset on; the store always answers.
  const chainHealthyFromReset = (healthyFrom: number, resetResponses: (() => Response)[] = []) =>
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/admin/devnet/reset")) {
        resets++;
        return resetResponses.shift()?.() ?? new Response("done");
      }
      return json({ height: resets >= healthyFrom ? 1 : -1 });
    });

  beforeEach(() => {
    resets = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resets again and logs the container output", async () => {
    chainHealthyFromReset(2);

    const done = resetDevnet();
    await jest.advanceTimersByTimeAsync(30_000);
    await expect(done).resolves.toBeUndefined();

    expect(calls("/admin/devnet/reset")).toHaveLength(2);
    expect(warnings()).toEqual([
      expect.stringMatching(/produced no block[\s\S]*resetting again[\s\S]*node socket file/),
    ]);
  });

  it("gives up after the second stuck reset, with the container logs", async () => {
    chainHealthyFromReset(Infinity);

    const assertion = expect(resetDevnet()).rejects.toThrow(
      /produced no block .* reset attempt 2 \(last height: -1\)[\s\S]*node socket file/,
    );
    await jest.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(calls("/admin/devnet/reset")).toHaveLength(2);
  });

  it("does not reset a third time when a 5xx used the retry", async () => {
    chainHealthyFromReset(Infinity, [() => new Response("boom", { status: 500 })]);

    const assertion = expect(resetDevnet()).rejects.toThrow("produced no block");
    await jest.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(calls("/admin/devnet/reset")).toHaveLength(2);
  });

  it("does not re-send the second reset after a transport error", async () => {
    chainHealthyFromReset(Infinity, [
      () => new Response("done"),
      () => {
        throw new TypeError("fetch failed");
      },
    ]);

    const assertion = expect(resetDevnet()).rejects.toThrow("fetch failed");
    await jest.advanceTimersByTimeAsync(60_000);
    await assertion;

    expect(calls("/admin/devnet/reset")).toHaveLength(2);
  });

  it("resets again when the container logs cannot be read", async () => {
    mockExecFile.mockImplementation(
      logsAnswer(new Error("Command failed: docker compose logs"), "", "no such service: yaci"),
    );
    chainHealthyFromReset(2);

    const done = resetDevnet();
    await jest.advanceTimersByTimeAsync(30_000);
    await expect(done).resolves.toBeUndefined();

    expect(calls("/admin/devnet/reset")).toHaveLength(2);
    expect(warnings()).toEqual([
      expect.stringMatching(/container logs unavailable: Command failed[\s\S]*no such service/),
    ]);
  });

  it("bounds the logs and in-container commands with a kill timeout", async () => {
    chainHealthyFromReset(2);

    const done = resetDevnet();
    await jest.advanceTimersByTimeAsync(30_000);
    await done;

    expect(mockExecFile).toHaveBeenCalledWith(
      "docker",
      expect.arrayContaining(["compose", "logs", "yaci"]),
      expect.objectContaining({ timeout: 10_000, killSignal: "SIGKILL" }),
      expect.any(Function),
    );
    expect(mockExecFile).toHaveBeenCalledWith(
      "docker",
      expect.arrayContaining(["compose", "exec", "-T", "yaci"]),
      expect.objectContaining({ timeout: 10_000, killSignal: "SIGKILL" }),
      expect.any(Function),
    );
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

    const assertion = expect(resetDevnet()).rejects.toThrow(/timed out[\s\S]*Container logs:/);
    await jest.advanceTimersByTimeAsync(160_000);
    await assertion;

    expect(calls("/admin/devnet/reset")).toHaveLength(1);
  });

  it("fails an admin GET that never answers", async () => {
    fetchMock.mockImplementation(never);

    const assertion = expect(adminGet("/admin/devnet")).rejects.toThrow("timed out");
    await jest.advanceTimersByTimeAsync(10_000);
    await assertion;
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
});

// Error and POST answers carry no body: yaci.ts cancels a body it does not read, and that cancel never
// settles on an MSW response.
describe("admin API over HTTP", () => {
  const ADMIN_API = "http://localhost:10000/local-cluster/api";
  const server = setupServer();
  const devnetEndpoint = jest.fn<Response, []>();
  const topupEndpoint = jest.fn<Response, []>();
  const utxosEndpoint = jest.fn<Response, []>();
  let interceptedFetch: typeof fetch;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    interceptedFetch = global.fetch;
  });
  afterAll(() => server.close());

  beforeEach(() => {
    global.fetch = interceptedFetch;
    devnetEndpoint.mockReset();
    topupEndpoint.mockReset();
    utxosEndpoint.mockReset();
    server.use(
      http.get(`${ADMIN_API}/admin/devnet`, () => devnetEndpoint()),
      http.post(`${ADMIN_API}/addresses/topup`, () => topupEndpoint()),
      http.get(`${YACI_STORE_API}/addresses/${ADDRESS}/utxos`, () => utxosEndpoint()),
    );
  });

  afterEach(() => {
    server.resetHandlers();
    jest.useRealTimers();
  });

  it("returns the parsed body of an admin GET", async () => {
    devnetEndpoint.mockReturnValue(HttpResponse.json({ protocolMagic: 42 }));

    await expect(adminGet("/admin/devnet")).resolves.toEqual({ protocolMagic: 42 });
    expect(devnetEndpoint).toHaveBeenCalledTimes(1);
  });

  it("throws with the status on a non-2xx admin GET", async () => {
    devnetEndpoint.mockReturnValue(new HttpResponse(null, { status: 500 }));

    await expect(adminGet("/admin/devnet")).rejects.toThrow(
      "Yaci admin GET /admin/devnet failed: 500",
    );
  });

  it("retries a faucet that answers 5xx", async () => {
    jest.useFakeTimers();
    topupEndpoint
      .mockReturnValueOnce(new HttpResponse(null, { status: 500 }))
      .mockReturnValueOnce(new HttpResponse(null));
    utxosEndpoint
      .mockReturnValueOnce(HttpResponse.json([]))
      .mockImplementation(() => HttpResponse.json([utxo("funding", "100000000")]));

    const done = topup(ADDRESS, 100);
    await jest.advanceTimersByTimeAsync(5_000);
    await expect(done).resolves.toBeUndefined();

    expect(topupEndpoint).toHaveBeenCalledTimes(2);
    expect(warnings()).toEqual([expect.stringContaining("/addresses/topup attempt 1 failed")]);
  });
});

describe("spawnYaci", () => {
  const RESET_URL = "http://localhost:10000/local-cluster/api/admin/devnet/reset";
  const unhealthy = { exitCode: 1, out: "", err: "container coin-tester-cardano is unhealthy" };
  const server = setupServer();
  const resetEndpoint = jest.fn<Response | Promise<Response>, []>();
  let interceptedFetch: typeof fetch;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    interceptedFetch = global.fetch;
  });
  afterAll(() => server.close());

  beforeEach(() => {
    global.fetch = interceptedFetch;
    jest.spyOn(console, "log").mockImplementation(() => {});
    mockUpOne.mockReset();
    mockDown.mockReset().mockResolvedValue({});
    resetEndpoint.mockReset().mockImplementation(() => new HttpResponse(null));
    server.use(
      http.post(RESET_URL, () => resetEndpoint()),
      http.get(`${YACI_STORE_API}/blocks/latest`, () => HttpResponse.json({ height: 1 })),
    );
  });

  afterEach(() => server.resetHandlers());

  it("resets the devnet when compose reports it unhealthy", async () => {
    mockUpOne.mockRejectedValue(unhealthy);

    await expect(spawnYaci()).resolves.toBeUndefined();

    expect(resetEndpoint).toHaveBeenCalledTimes(1);
    expect(mockDown).not.toHaveBeenCalled();
    expect(warnings()).toEqual([
      expect.stringMatching(
        /did not become healthy \(exit code 1\n[\s\S]*resetting it[\s\S]*node socket/,
      ),
    ]);
  });

  it("fails with the compose and reset errors and releases the container when the reset fails", async () => {
    mockUpOne.mockRejectedValue(unhealthy);
    resetEndpoint.mockReturnValue(HttpResponse.error());

    await expect(spawnYaci()).rejects.toThrow(
      /did not become healthy: exit code 1\ncontainer coin-tester-cardano is unhealthy\nReset failed: /,
    );
    expect(mockDown).toHaveBeenCalledTimes(1);
  });

  it("fails without a reset when the container does not start", async () => {
    mockUpOne.mockRejectedValue({ exitCode: 1, out: "", err: "port is already allocated" });
    mockExecFile.mockImplementation(logsAnswer(null, CONTAINER_LOGS, "store failed to start"));

    await expect(spawnYaci()).rejects.toThrow(
      /did not start: exit code 1\nport is already allocated\nstore failed to start\nWaiting for node socket/,
    );
    expect(resetEndpoint).not.toHaveBeenCalled();
    expect(mockDown).toHaveBeenCalledTimes(1);
  });

  it("reports the container logs when the in-container diagnostics cannot run", async () => {
    mockUpOne.mockRejectedValue(unhealthy);
    mockExecFile.mockImplementation((...args: unknown[]) =>
      (args[1] as string[]).includes("exec")
        ? logsAnswer(new Error("Command failed: docker compose exec"), "", "")(...args)
        : logsAnswer(null, CONTAINER_LOGS)(...args),
    );

    await spawnYaci();

    expect(warnings()).toEqual([
      expect.stringMatching(/node socket[\s\S]*container internals unavailable: Command failed/),
    ]);
  });

  it("does not reset a devnet that becomes healthy", async () => {
    mockUpOne.mockResolvedValue({ exitCode: 0, out: "", err: "" });

    await spawnYaci();

    expect(resetEndpoint).not.toHaveBeenCalled();
  });
});

describe("topup", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

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
