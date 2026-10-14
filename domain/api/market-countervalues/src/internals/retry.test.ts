import { rateFetchRetryOptions } from "./retry";

const { maxRetries, retryCondition } = rateFetchRetryOptions;

function retries(status: number | string): boolean {
  return retryCondition({ status } as never, undefined, { attempt: 1 });
}

test("overrides the shared base query's retry(3) with live-network's 2", () => {
  expect(maxRetries).toBe(2);
});

test("never retries a 422, which means an unsupported pair", () => {
  expect(retries(422)).toBe(false);
});

test("retries the transient statuses live-network retried", () => {
  for (const status of [408, 413, 429, 500, 502, 503, 504, 521, 522, 524]) {
    expect(retries(status)).toBe(true);
  }
});

test("does not retry other 4xx", () => {
  for (const status of [400, 401, 403, 404]) {
    expect(retries(status)).toBe(false);
  }
});

test("retries a dead connection and a timeout", () => {
  expect(retries("FETCH_ERROR")).toBe(true);
  expect(retries("TIMEOUT_ERROR")).toBe(true);
});

test("does not retry a payload the schema rejected", () => {
  expect(retries("PARSING_ERROR")).toBe(false);
  expect(retries("CUSTOM_ERROR")).toBe(false);
});

test("stops once the attempt budget is spent", () => {
  expect(retryCondition({ status: 503 } as never, undefined, { attempt: 2 })).toBe(true);
  expect(retryCondition({ status: 503 } as never, undefined, { attempt: 3 })).toBe(false);
});
