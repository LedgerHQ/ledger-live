import assert from "node:assert/strict";
import test from "node:test";
import type { Flake } from "../src/core/detect.ts";
import {
  batchEvents,
  reportFlakes,
  retryAfterSeconds,
  toIngestEvents,
  type IngestEvent,
} from "../src/core/ingest.ts";

const CI_ENV: NodeJS.ProcessEnv = {
  CI: "true",
  FLAKE_API_KEY: "key",
  FLAKE_API_HOST: "https://flake.example",
};

function flake(partial: Partial<Flake> = {}): Flake {
  return { file: "a.test.ts", title: "does a thing", retryCount: 1, ...partial };
}

function event(partial: Partial<IngestEvent> = {}): IngestEvent {
  return {
    testTitle: "t",
    file: "f",
    errorMessage: "",
    occurredAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("events carry the GitHub run URL when the CI variables are present", () => {
  const [ingested] = toIngestEvents([flake()], {
    env: {
      ...CI_ENV,
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_REPOSITORY: "LedgerHQ/ledger-live",
      GITHUB_RUN_ID: "42",
    },
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  assert.equal(ingested.ciRunUrl, "https://github.com/LedgerHQ/ledger-live/actions/runs/42");
  assert.equal(ingested.occurredAt, "2026-01-01T00:00:00.000Z");
});

test("error messages are redacted", () => {
  const [ingested] = toIngestEvents(
    [flake({ errorMessage: "failed at https://rpc.example/?key=abc123" })],
    { env: CI_ENV },
  );
  assert.equal(ingested.errorMessage, "failed at [redacted:url]");
});

test("stack frames are stripped out of the reported error", () => {
  // Real jest failure text: assertion diff, then the frame list.
  const jestFailure = [
    "Error: expect(received).toBe(expected)",
    "",
    "Expected: true",
    "Received: false",
    "    at toBe (/Users/someone/repo/src/dup.test.js:3:16)",
    "    at Object.<anonymous> (/Users/someone/repo/node_modules/jest-each/build/index.js:80:140)",
  ].join("\n");

  const [ingested] = toIngestEvents([flake({ errorMessage: jestFailure })], { env: CI_ENV });

  assert.equal(
    ingested.errorMessage,
    "Error: expect(received).toBe(expected)\n\nExpected: true\nReceived: false",
  );
  assert.ok(!ingested.errorMessage.includes("at "), "no frames survive");
  assert.ok(!ingested.errorMessage.includes("/Users/"), "no absolute paths survive");
});

test("retryCount is clamped into the contract's range", () => {
  const [low] = toIngestEvents([flake({ retryCount: -5 })], { env: CI_ENV });
  const [high] = toIngestEvents([flake({ retryCount: 10_000 })], { env: CI_ENV });
  assert.equal(low.retryCount, 0);
  assert.equal(high.retryCount, 100);
});

test("long fields are truncated to the contract's limits", () => {
  const [ingested] = toIngestEvents(
    [
      flake({
        title: "t".repeat(1500),
        file: "f".repeat(1500),
        errorMessage: "e".repeat(25_000),
      }),
    ],
    { env: CI_ENV },
  );
  assert.equal(ingested.testTitle.length, 1000);
  assert.equal(ingested.file.length, 1000);
  assert.equal(ingested.errorMessage.length, 20_000);
});

test("batches are capped at 500 events", () => {
  const events = Array.from({ length: 1200 }, () => event());
  const batches = batchEvents(events);
  assert.deepEqual(
    batches.map(batch => batch.length),
    [500, 500, 200],
  );
});

test("events are split when the body would exceed the size limit", () => {
  // Each event is capped at 20 KB of error text by toIngestEvents, so reaching
  // the 1 MiB body limit takes many of them rather than one huge one.
  const big = event({ errorMessage: "x".repeat(20_000) });
  const batches = batchEvents(Array.from({ length: 100 }, () => big));

  assert.equal(batches.flat().length, 100, "no event is lost");
  assert.ok(batches.length >= 2, "the batch was split");
  for (const batch of batches) {
    const bytes = Buffer.byteLength(JSON.stringify({ events: batch }), "utf8");
    assert.ok(bytes <= 1024 * 1024, `batch of ${batch.length} is ${bytes} bytes`);
  }
});

test("Retry-After is bounded so a bad header cannot park the job", () => {
  assert.equal(retryAfterSeconds("5"), 5);
  assert.equal(retryAfterSeconds("86400"), 30, "clamped to the ceiling");
  assert.equal(retryAfterSeconds("-1"), 1, "negative falls back to the default");
  assert.equal(retryAfterSeconds("soon"), 1, "non-numeric falls back to the default");
  assert.equal(retryAfterSeconds(null), 1, "missing falls back to the default");
});

test("reporting is a no-op outside CI", async () => {
  let called = false;
  const summary = await reportFlakes([flake()], {
    env: { FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example" },
    fetchImpl: (async () => {
      called = true;
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });
  assert.equal(summary.skipped, true);
  assert.equal(summary.reason, "not CI");
  assert.equal(called, false);
});

test("reporting warns once and no-ops when it is not configured", async () => {
  const warnings: string[] = [];
  const summary = await reportFlakes([flake()], {
    env: { CI: "true" },
    warn: message => warnings.push(message),
    fetchImpl: (() => assert.fail("must not call fetch")) as unknown as typeof fetch,
  });
  assert.equal(summary.skipped, true);
  assert.equal(warnings.length, 1);
});

test("a successful post reports what was delivered", async () => {
  const requests: { url: string; body: string; apiKey: string }[] = [];
  const summary = await reportFlakes([flake(), flake({ title: "another" })], {
    env: CI_ENV,
    fetchImpl: (async (url, init = {}) => {
      requests.push({
        url: String(url),
        body: String(init.body),
        apiKey: String((init.headers as Record<string, string>)["x-api-key"]),
      });
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });

  assert.deepEqual(summary, { attempted: 2, delivered: 2, skipped: false });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://flake.example/api/ingest");
  assert.equal(requests[0].apiKey, "key");
  assert.equal(JSON.parse(requests[0].body).events.length, 2);
});

test("a rate-limited batch is retried after the bounded delay", async () => {
  const slept: number[] = [];
  let calls = 0;
  const summary = await reportFlakes([flake()], {
    env: CI_ENV,
    sleep: async ms => {
      slept.push(ms);
    },
    fetchImpl: (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response("", { status: 429, headers: { "retry-after": "86400" } });
      }
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });

  assert.deepEqual(slept, [30_000], "the absurd Retry-After was clamped");
  assert.equal(summary.delivered, 1);
});

test("a persistently rate-limited batch gives up instead of looping forever", async () => {
  let calls = 0;
  const summary = await reportFlakes([flake()], {
    env: CI_ENV,
    warn: () => {},
    sleep: async () => {},
    fetchImpl: (async () => {
      calls += 1;
      return new Response("", { status: 429, headers: { "retry-after": "1" } });
    }) as typeof fetch,
  });
  assert.equal(calls, 5, "bounded by the per-batch attempt limit");
  assert.equal(summary.delivered, 0);
});

test("a server error is logged and never thrown", async () => {
  const warnings: string[] = [];
  const summary = await reportFlakes([flake()], {
    env: CI_ENV,
    warn: message => warnings.push(message),
    fetchImpl: (async () => new Response("", { status: 500 })) as typeof fetch,
  });
  assert.equal(summary.delivered, 0);
  assert.equal(summary.skipped, false);
  assert.equal(warnings.length, 1);
});

test("a network failure is logged and never thrown", async () => {
  const warnings: string[] = [];
  const summary = await reportFlakes([flake()], {
    env: CI_ENV,
    warn: message => warnings.push(message),
    fetchImpl: (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch,
  });
  assert.equal(summary.delivered, 0);
  assert.match(warnings[0], /ECONNREFUSED/);
});

test("a malformed FLAKE_API_HOST warns instead of throwing", async () => {
  const warnings: string[] = [];
  const summary = await reportFlakes([flake()], {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "not a url" },
    warn: message => warnings.push(message),
    fetchImpl: (() => assert.fail("must not fetch with a bad host")) as unknown as typeof fetch,
  });
  assert.equal(summary.skipped, true);
  assert.equal(summary.reason, "bad host");
  assert.match(warnings[0], /not a valid URL/);
});

test("a host with a path prefix keeps that prefix", async () => {
  const urls: string[] = [];
  await reportFlakes([flake()], {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://proxy.example/flake" },
    fetchImpl: (async url => {
      urls.push(String(url));
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });
  assert.deepEqual(urls, ["https://proxy.example/flake/api/ingest"]);
});

test("a trailing slash on the host does not double up", async () => {
  const urls: string[] = [];
  await reportFlakes([flake()], {
    env: { CI: "true", FLAKE_API_KEY: "key", FLAKE_API_HOST: "https://flake.example/" },
    fetchImpl: (async url => {
      urls.push(String(url));
      return new Response("", { status: 200 });
    }) as typeof fetch,
  });
  assert.deepEqual(urls, ["https://flake.example/api/ingest"]);
});

test("the 429 backoff budget is shared across batches, not per batch", async () => {
  // Enough events to need several batches, every one rate-limited forever.
  const many = Array.from({ length: 1200 }, (_, index) => flake({ title: `t${index}` }));
  const slept: number[] = [];

  await reportFlakes(many, {
    env: CI_ENV,
    warn: () => {},
    sleep: async ms => {
      slept.push(ms);
    },
    fetchImpl: (async () =>
      new Response("", { status: 429, headers: { "retry-after": "30" } })) as typeof fetch,
  });

  const totalMs = slept.reduce((sum, ms) => sum + ms, 0);
  assert.ok(totalMs <= 60_000, `total backoff was ${totalMs}ms`);
});

test("a blank Retry-After does not busy-loop", () => {
  assert.equal(retryAfterSeconds(""), 1);
  assert.equal(retryAfterSeconds("   "), 1);
});
