import test from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  reportFlakes,
  batchEvents,
  toIngestEvents,
  redactErrorMessage,
  type IngestEvent,
} from "../src/flake/report.ts";
import type { FlakeEvent } from "../src/flake/reduce.ts";
import type { LoadedEntry } from "../src/schema.ts";

interface MockServer {
  server: Server;
  url: string;
  requests: { events: IngestEvent[] }[];
  setResponder: (
    fn: (count: number) => { status: number; headers?: Record<string, string> },
  ) => void;
}

function startMock(): Promise<MockServer> {
  const requests: { events: IngestEvent[] }[] = [];
  let responder = (_count: number) =>
    ({ status: 202 }) as { status: number; headers?: Record<string, string> };
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", c => (body += c));
      req.on("end", () => {
        requests.push(JSON.parse(body));
        const { status, headers } = responder(requests.length);
        res.writeHead(status, headers ?? {});
        res.end(JSON.stringify({ accepted: true }));
      });
    });
    server.unref(); // never let a leftover server keep the event loop alive
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        server,
        url: `http://127.0.0.1:${port}`,
        requests,
        setResponder: fn => {
          responder = fn;
        },
      });
    });
  });
}

const flake = (over: Partial<FlakeEvent> = {}): FlakeEvent => ({
  file: "e2e/specs/a.spec.ts",
  title: "flaky test",
  errorMessage: "boom",
  retryCount: 1,
  ...over,
});

const CI_ENV = { CI: "1", FLAKE_API_KEY: "secret" } as NodeJS.ProcessEnv;

test("posts one event to the mock ingest server", async () => {
  const mock = await startMock();
  const summary = await reportFlakes([flake()], [], { env: CI_ENV, host: mock.url });
  assert.equal(summary.delivered, 1);
  assert.equal(mock.requests.length, 1);
  assert.equal(mock.requests[0].events.length, 1);
  assert.equal(mock.requests[0].events[0].testTitle, "flaky test");
  mock.server.close();
});

test("payload conforms to the ingest contract fields", async () => {
  const mock = await startMock();
  await reportFlakes([flake()], [], {
    env: {
      ...CI_ENV,
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_REPOSITORY: "o/r",
      GITHUB_RUN_ID: "5",
    },
    host: mock.url,
  });
  const e = mock.requests[0].events[0];
  assert.ok(typeof e.testTitle === "string" && e.testTitle.length <= 1000);
  assert.ok(typeof e.file === "string");
  assert.ok(typeof e.errorMessage === "string");
  assert.equal(e.retryCount, 1);
  assert.equal(e.ciRunUrl, "https://github.com/o/r/actions/runs/5");
  assert.ok(typeof e.occurredAt === "string" && !Number.isNaN(Date.parse(e.occurredAt)));
  assert.equal(
    Object.prototype.hasOwnProperty.call(e, "stack"),
    false,
    "stack is omitted (provisional redaction)",
  );
  mock.server.close();
});

test("missing FLAKE_API_KEY is a no-op (no request)", async () => {
  const mock = await startMock();
  const warnings: string[] = [];
  const summary = await reportFlakes([flake()], [], {
    env: { CI: "1" } as NodeJS.ProcessEnv,
    host: mock.url,
    warn: m => warnings.push(m),
  });
  assert.equal(summary.skipped, true);
  assert.equal(mock.requests.length, 0);
  assert.match(warnings[0], /FLAKE_API_KEY unset/);
  mock.server.close();
});

test("non-CI is a no-op", async () => {
  const mock = await startMock();
  const summary = await reportFlakes([flake()], [], {
    env: { FLAKE_API_KEY: "x" } as NodeJS.ProcessEnv,
    host: mock.url,
  });
  assert.equal(summary.skipped, true);
  assert.equal(mock.requests.length, 0);
  mock.server.close();
});

test("429 is retried honouring Retry-After, then succeeds", async () => {
  const mock = await startMock();
  mock.setResponder(count =>
    count === 1 ? { status: 429, headers: { "retry-after": "0" } } : { status: 202 },
  );
  const sleeps: number[] = [];
  const summary = await reportFlakes([flake()], [], {
    env: CI_ENV,
    host: mock.url,
    sleep: async ms => {
      sleeps.push(ms);
    },
  });
  assert.equal(summary.delivered, 1);
  assert.equal(mock.requests.length, 2);
  assert.equal(sleeps[0], 0);
  mock.server.close();
});

test("server error logs and continues (never throws)", async () => {
  const mock = await startMock();
  mock.setResponder(() => ({ status: 500 }));
  const warnings: string[] = [];
  const summary = await reportFlakes([flake()], [], {
    env: CI_ENV,
    host: mock.url,
    warn: m => warnings.push(m),
  });
  assert.equal(summary.delivered, 0);
  assert.ok(warnings.some(w => /failed \(500\)/.test(w)));
  mock.server.close();
});

test("network error is swallowed", async () => {
  const summary = await reportFlakes([flake()], [], {
    env: CI_ENV,
    host: "http://127.0.0.1:1", // nothing listening
    warn: () => {},
  });
  assert.equal(summary.delivered, 0);
  assert.equal(summary.skipped, false);
});

test("batchEvents splits on the 500-event limit", () => {
  const events: IngestEvent[] = Array.from({ length: 1100 }, (_, i) => ({
    testTitle: `t${i}`,
    file: "f",
    errorMessage: "e",
    occurredAt: "2026-01-01T00:00:00.000Z",
  }));
  const batches = batchEvents(events);
  assert.equal(batches.length, 3);
  assert.equal(batches[0].length, 500);
  assert.equal(batches[2].length, 100);
});

test("batchEvents splits on the 1 MiB body limit", () => {
  const big = "x".repeat(200_000);
  const events: IngestEvent[] = Array.from({ length: 10 }, () => ({
    testTitle: "t",
    file: "f",
    errorMessage: big,
    occurredAt: "2026-01-01T00:00:00.000Z",
  }));
  const batches = batchEvents(events);
  assert.ok(batches.length > 1, "large events split across batches");
});

test("redaction strips hex blobs, urls, mnemonics", () => {
  // Build the 12-word BIP39-style phrase at runtime so the source carries no
  // contiguous seed-phrase literal (the gitleaks seed-phrase rule flags those).
  const mnemonic = `${Array(11).fill("abandon").join(" ")} about`;
  const msg = redactErrorMessage(
    `fail 0xdeadbeefdeadbeefdeadbeef at https://rpc.example.com/key?x=1 mnemonic ${mnemonic}`,
  );
  assert.match(msg, /\[redacted:hex\]/);
  assert.match(msg, /\[redacted:url\]/);
  assert.match(msg, /\[redacted:mnemonic\]/);
});

test("codeowner inferred from matching entry", () => {
  const entry: LoadedEntry = {
    entry: {
      mode: "ignore",
      reason: "r",
      owner: "@LedgerHQ/team-x",
      expiry: "2999-01-01",
      filter: { file: "e2e/specs/a.spec.ts", title: "flaky test" },
    },
    sourcePath: "/tmp/x.yaml",
    sourceRelative: "quarantine/x.yaml",
  };
  const events = toIngestEvents([flake()], [entry], CI_ENV);
  assert.equal(events[0].codeowner, "@LedgerHQ/team-x");
});
