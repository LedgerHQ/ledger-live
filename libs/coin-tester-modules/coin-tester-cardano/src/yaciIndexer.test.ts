import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { YACI_STORE_API } from "./yaci";
import { latestParams } from "./yaciIndexer";

// yaci.ts tears the devnet down on process exit; keep that from touching a real container.
jest.mock("docker-compose", () => ({ down: jest.fn().mockResolvedValue({}) }));

const PARAMS = { key_deposit: 2_000_000 };
const PARAMS_URL = `${YACI_STORE_API}/epochs/latest/parameters`;

const server = setupServer();
const paramsEndpoint = jest.fn<Response | Promise<Response>, []>();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

beforeEach(() => {
  paramsEndpoint.mockReset();
  server.use(http.get(PARAMS_URL, () => paramsEndpoint()));
  jest.useFakeTimers();
});

afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("latestParams", () => {
  it("retries until the store serves the epoch parameters", async () => {
    paramsEndpoint
      .mockReturnValueOnce(HttpResponse.error())
      .mockReturnValueOnce(new HttpResponse(null, { status: 500 }))
      .mockReturnValueOnce(HttpResponse.json(PARAMS));

    const params = latestParams();
    await jest.advanceTimersByTimeAsync(5_000);

    await expect(params).resolves.toEqual(PARAMS);
    expect(paramsEndpoint).toHaveBeenCalledTimes(3);
  });

  // The live indexer's passthrough drops the AbortSignal; an inert signal leaves the wall-clock
  // deadline as the only thing that can release these reads.
  it("moves past reads that never settle", async () => {
    jest.spyOn(AbortSignal, "timeout").mockImplementation(() => new AbortController().signal);
    paramsEndpoint
      .mockReturnValueOnce(new Promise<Response>(() => {}))
      .mockReturnValueOnce(new HttpResponse(new ReadableStream({ start() {} })))
      .mockReturnValueOnce(HttpResponse.json(PARAMS));

    const params = latestParams();
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(params).resolves.toEqual(PARAMS);
    expect(paramsEndpoint).toHaveBeenCalledTimes(3);
  });

  it("gives up after five failed reads", async () => {
    paramsEndpoint.mockImplementation(() => new HttpResponse(null, { status: 404 }));

    const params = latestParams();
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(params).resolves.toBeNull();
    expect(paramsEndpoint).toHaveBeenCalledTimes(5);
  });
});
