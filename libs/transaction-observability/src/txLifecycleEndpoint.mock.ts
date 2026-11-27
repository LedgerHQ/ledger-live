import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export type LifecycleRequest = { url: string; body: Record<string, unknown> };

type EndpointArgs = { request: Request };

/**
 * Answers every POST to `/v1/tx/lifecycle`, whatever the sink's origin, and records what it got.
 *
 * Posting is fire and forget, so `received()` first waits for the requests still in flight.
 * Call it from `describe`: it registers the server's lifecycle hooks.
 */
export function listenToTxLifecycle() {
  const server = setupServer();
  const endpoint = jest.fn<Response, [EndpointArgs]>();
  let requests: LifecycleRequest[] = [];
  let inFlight = 0;

  server.events.on("request:start", () => {
    inFlight += 1;
  });
  server.events.on("request:end", () => {
    inFlight -= 1;
  });
  server.events.on("unhandledException", () => {
    inFlight -= 1;
  });

  const settle = async () => {
    do {
      await new Promise(resolve => setImmediate(resolve));
    } while (inFlight > 0);
  };

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

  beforeEach(() => {
    requests = [];
    endpoint.mockReset().mockImplementation(() => HttpResponse.json({}));
    server.use(
      http.post("*/v1/tx/lifecycle", async ({ request }) => {
        const received: LifecycleRequest = { url: request.url, body: {} };
        requests.push(received);
        received.body = await request.clone().json();
        return endpoint({ request });
      }),
    );
  });

  afterEach(async () => {
    await settle();
    server.resetHandlers();
  });

  afterAll(() => server.close());

  return {
    endpoint,
    /** Every lifecycle request received so far, in the order it was sent. */
    received: async (): Promise<LifecycleRequest[]> => {
      await settle();
      return [...requests];
    },
    /** Forgets what was received so far, once the requests in flight have landed. */
    forget: async () => {
      await settle();
      requests = [];
      endpoint.mockClear();
    },
  };
}
