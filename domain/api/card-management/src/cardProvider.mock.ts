import { http, HttpResponse, type JsonBodyType } from "msw";
import { setupServer } from "msw/node";
import { PayCardErrorResponseSchema } from "./schema";

export const CARD_API_BASE_URL = "https://card.test";

export type SentRequest = {
  url: string;
  method: string;
  headers: Headers;
  body: string;
};

type Answer = () => Response | Promise<Response>;

export type CardProvider = {
  get: (path: string, answer: Answer) => void;
  post: (path: string, answer: Answer) => void;
  sent: () => SentRequest;
  sentTo: (path: string) => SentRequest[];
  requests: () => SentRequest[];
};

export function mockCardProvider(): CardProvider {
  const server = setupServer();
  const sentRequests: SentRequest[] = [];

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

  afterEach(() => {
    server.resetHandlers();
    sentRequests.length = 0;
  });

  afterAll(() => server.close());

  const route =
    (method: typeof http.get) =>
    (path: string, answer: Answer): void => {
      server.use(
        method(`${CARD_API_BASE_URL}${path}`, async ({ request }) => {
          sentRequests.push({
            url: request.url,
            method: request.method,
            headers: request.headers,
            body: await request.clone().text(),
          });
          return answer();
        }),
      );
    };

  return {
    get: route(http.get),
    post: route(http.post),
    sent: () => sentRequests[0],
    sentTo: path => sentRequests.filter(({ url }) => new URL(url).pathname === path),
    requests: () => [...sentRequests],
  };
}

export function jsonResponse(body: JsonBodyType): Response {
  return HttpResponse.json(body);
}

export function errorResponse(status: number, message: string): Response {
  return HttpResponse.json(PayCardErrorResponseSchema.parse({ message }), { status });
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

export function flushPendingRequests(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
