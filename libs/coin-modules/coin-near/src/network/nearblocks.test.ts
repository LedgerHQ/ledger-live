import { getNetworkState } from "@ledgerhq/live-network";
import { http, HttpResponse } from "msw";
import { mockNearConfig } from "../test/context";
import { fetchNearblocks } from "./nearblocks";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";

const PATH = "/v3/stats";

const counting = (respond: (attempt: number) => Response): { requests: () => number } => {
  let requests = 0;
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}${PATH}`, () => {
      requests += 1;
      return respond(requests);
    }),
  );
  return { requests: () => requests };
};

describe("fetchNearblocks", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("returns the response body from the nearblocks base URL and the given path", async () => {
    const counter = counting(() => HttpResponse.json({ data: { gas_price: "1" } }));

    await expect(fetchNearblocks(mockNearConfig, PATH)).resolves.toEqual({
      data: { gas_price: "1" },
    });
    expect(counter.requests()).toBe(1);
  });

  it("does not retry a 429", async () => {
    const counter = counting(() =>
      HttpResponse.json({ message: "Too Many Requests" }, { status: 429 }),
    );

    await expect(fetchNearblocks(mockNearConfig, PATH)).rejects.toMatchObject({
      status: 429,
    });
    expect(counter.requests()).toBe(1);
  });

  it("retries a 503 as many times as live-network is configured to", async () => {
    const counter = counting(() => HttpResponse.json({}, { status: 503 }));

    await expect(fetchNearblocks(mockNearConfig, PATH)).rejects.toMatchObject({ status: 503 });
    expect(counter.requests()).toBe(getNetworkState().getCallsRetry + 1);
  });

  it("resolves when a 503 is followed by a success", async () => {
    const counter = counting(attempt =>
      attempt === 1
        ? HttpResponse.json({}, { status: 503 })
        : HttpResponse.json({ data: { gas_price: "2" } }),
    );

    await expect(fetchNearblocks(mockNearConfig, PATH)).resolves.toEqual({
      data: { gas_price: "2" },
    });
    expect(counter.requests()).toBe(2);
  });

  it("does not retry a 404", async () => {
    const counter = counting(() => HttpResponse.json({}, { status: 404 }));

    await expect(fetchNearblocks(mockNearConfig, PATH)).rejects.toMatchObject({ status: 404 });
    expect(counter.requests()).toBe(1);
  });
});
