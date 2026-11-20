import { latestParams } from "./yaciIndexer";

// yaci.ts tears the devnet down on process exit; keep that from touching a real container.
jest.mock("docker-compose", () => ({ down: jest.fn().mockResolvedValue({}) }));

const PARAMS = { key_deposit: 2_000_000 };
const fetchMock = jest.fn();
const realFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  jest.useFakeTimers();
});

afterEach(() => {
  global.fetch = realFetch;
  jest.useRealTimers();
});

describe("latestParams", () => {
  it("retries until the store serves the epoch parameters", async () => {
    const answers = [
      () => Promise.reject(new TypeError("fetch failed")),
      () => Promise.resolve(new Response("", { status: 500 })),
      () => Promise.resolve(new Response(JSON.stringify(PARAMS))),
    ];
    fetchMock.mockImplementation(() => answers.shift()!());

    const params = latestParams();
    await jest.advanceTimersByTimeAsync(5_000);

    await expect(params).resolves.toEqual(PARAMS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  // MSW passthrough drops the AbortSignal, so these reads never settle and ignore their signal.
  it("moves past reads that never settle", async () => {
    const answers = [
      () => new Promise<Response>(() => {}),
      () => Promise.resolve(new Response(new ReadableStream({ start() {} }))),
      () => Promise.resolve(new Response(JSON.stringify(PARAMS))),
    ];
    fetchMock.mockImplementation(() => answers.shift()!());

    const params = latestParams();
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(params).resolves.toEqual(PARAMS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up after five failed reads", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response("", { status: 404 })));

    const params = latestParams();
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(params).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
