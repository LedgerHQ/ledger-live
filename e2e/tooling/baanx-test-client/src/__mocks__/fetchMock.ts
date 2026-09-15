import type { FetchImpl, ResolvedBaanxAuthConfig } from "../types";

/**
 * RFC 6238 test secret in base32 — it decodes to the ASCII string
 * "12345678901234567890" published in the RFC. Not a credential; gitleaks
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

export function createFakeClock(startMs: number): { clock: FakeClock } {
  let current = startMs;

  return {
    clock: {
      now: () => current,
      sleep: async (ms: number) => {
        current += ms;
      },
    },
  };
}
