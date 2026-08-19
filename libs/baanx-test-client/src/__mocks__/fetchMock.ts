import type { FetchImpl, ResolvedBaanxAuthConfig } from "../types";

/**
 * Test doubles. Unit tests never touch the network: every suite injects
 * `fetchImpl` and a fake clock, so nothing depends on wall time either.
 */

/**
 * RFC 6238 test secret in base32 — it decodes to the ASCII string
 * "12345678901234567890" published in the RFC, and is what the appendix B
 * vectors in totp.test.ts are computed against. Not a credential; gitleaks
 * flags it on entropy alone.
 */
export const RFC6238_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // gitleaks:allow

export function testConfig(
  overrides: Partial<ResolvedBaanxAuthConfig> = {},
): ResolvedBaanxAuthConfig {
  return {
    baseUrl: "https://dev.api.baanx.test",
    clientKey: "test-client-key",
    email: "tester@ledger.test",
    password: "correct horse battery staple",
    region: "international",
    ...overrides,
    totp: {
      secret: RFC6238_SECRET,
      digits: 6,
      period: 30,
      algorithm: "SHA1",
      ...overrides.totp,
    },
  };
}

export interface MockResponseSpec {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Simulate a transport failure instead of responding. */
  throws?: string;
}

export interface RecordedRequest {
  url: string;
  path: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface FetchMock {
  fetchImpl: FetchImpl;
  requests: RecordedRequest[];
}

/**
 * Replies with `specs` in order. Running out of specs is a test bug, so it
 * throws loudly rather than hanging or returning something plausible.
 */
export function createFetchMock(specs: MockResponseSpec[]): FetchMock {
  const requests: RecordedRequest[] = [];
  let callIndex = 0;

  const fetchImpl = (async (input: string, init?: RequestInit) => {
    const spec = specs[callIndex];
    if (!spec) {
      throw new Error(`fetch mock received an unexpected call #${callIndex + 1} to ${input}`);
    }
    callIndex += 1;

    requests.push({
      url: input,
      path: new URL(input).pathname,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });

    if (spec.throws) throw new Error(spec.throws);

    // A real Response, so status/ok/headers/text() behave exactly as in prod.
    return new Response(spec.body === undefined ? null : JSON.stringify(spec.body), {
      status: spec.status ?? 200,
      headers: spec.headers,
    });
  }) as unknown as FetchImpl;

  return { fetchImpl, requests };
}

export interface FakeClock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export interface FakeClockHandle {
  clock: FakeClock;
  /** Every sleep duration requested, in order. */
  sleeps: number[];
}

/** A clock that only moves when something sleeps. No wall-time dependency. */
export function createFakeClock(startMs: number): FakeClockHandle {
  let current = startMs;
  const sleeps: number[] = [];

  return {
    clock: {
      now: () => current,
      sleep: async (ms: number) => {
        sleeps.push(ms);
        current += ms;
      },
    },
    sleeps,
  };
}

/** A JWT with the given `exp`. Signature is not read, so it is a placeholder. */
export function jwtWithExpiry(expSeconds: number): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp: expSeconds })}.signature`;
}
