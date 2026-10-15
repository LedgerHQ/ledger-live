import assert from "node:assert/strict";
import test from "node:test";
import { createR2LockStore } from "./r2LockStore";
import type { LockRecord } from "./types";

type RecordedRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

const record: LockRecord = {
  holder: "ios-runner",
  label: "Send ETH",
  leaseMs: 120_000,
  settleMs: 45_000,
  released: false,
};

const createStore = (
  respond: (request: RecordedRequest) => Response,
  endpoint = "account.r2.cloudflarestorage.com",
) => {
  const requests: RecordedRequest[] = [];
  const fetchImpl = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const request: RecordedRequest = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: { ...(init?.headers as Record<string, string>) },
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    requests.push(request);
    return respond(request);
  }) as typeof fetch;
  const store = createR2LockStore({
    endpoint,
    bucket: "ledger-live-cache",
    prefix: "e2e-broadcast-locks/",
    credentials: { accessKeyId: "key-id", secretAccessKey: "secret" },
    fetchImpl,
    now: () => new Date("2026-10-12T12:00:00Z"),
  });
  return { store, requests };
};

test("creates a lock with If-None-Match: * on a path-style object keyed by the account", async () => {
  const { store, requests } = createStore(
    () => new Response(null, { status: 200, headers: { etag: '"etag-1"' } }),
  );

  const etag = await store.create("ethereum:44'/60'/0'/0/0", record);

  assert.equal(etag, '"etag-1"');
  const [request] = requests;
  assert.equal(request.method, "PUT");
  assert.equal(
    request.url,
    `https://account.r2.cloudflarestorage.com/ledger-live-cache/e2e-broadcast-locks/${Buffer.from("ethereum:44'/60'/0'/0/0").toString("base64url")}.json`,
  );
  assert.equal(request.headers["if-none-match"], "*");
  assert.match(request.headers.authorization, /SignedHeaders=content-type;host;if-none-match;/);
  const { writeId, ...stored } = JSON.parse(request.body ?? "");
  assert.equal(typeof writeId, "string");
  assert.deepEqual(stored, record);
});

test("writes a distinct body on every renewal so a stale If-Match cannot match it", async () => {
  const { store, requests } = createStore(
    () => new Response(null, { status: 200, headers: { etag: '"etag-1"' } }),
  );

  await store.replace("key", record, '"etag-0"');
  await store.replace("key", record, '"etag-1"');

  assert.notEqual(requests[0].body, requests[1].body);
});

test("reports a held lock instead of failing when the create precondition is not met", async () => {
  const { store } = createStore(() => new Response("PreconditionFailed", { status: 412 }));

  assert.equal(await store.create("key", record), undefined);
});

test("replaces only the version it read, with If-Match", async () => {
  const { store, requests } = createStore(() => new Response("Conflict", { status: 409 }));

  assert.equal(await store.replace("key", record, '"etag-1"'), undefined);
  assert.equal(requests[0].headers["if-match"], '"etag-1"');
});

test("reads a lock with its age measured on the server clock", async () => {
  const { store } = createStore(
    () =>
      new Response(JSON.stringify(record), {
        status: 200,
        headers: {
          etag: '"etag-2"',
          date: "Mon, 12 Oct 2026 12:02:30 GMT",
          "last-modified": "Mon, 12 Oct 2026 12:00:00 GMT",
        },
      }),
  );

  assert.deepEqual(await store.read("key"), { record, etag: '"etag-2"', ageMs: 150_000 });
});

test("refuses a lock whose age the server's clock headers cannot give", async () => {
  const { store } = createStore(
    () =>
      new Response(JSON.stringify(record), {
        status: 200,
        headers: { etag: '"etag-2"', date: "not a date", "last-modified": "not a date" },
      }),
  );

  await assert.rejects(store.read("key"), {
    name: "BroadcastLockStoreFatalError",
    message: /unreadable Date or Last-Modified header/,
  });
});

test("asks for an uncompressed lock, outside the signature, so its ETag stays strong", async () => {
  const { store, requests } = createStore(
    () =>
      new Response(JSON.stringify(record), {
        status: 200,
        headers: {
          etag: '"etag-2"',
          date: "Mon, 12 Oct 2026 12:02:30 GMT",
          "last-modified": "Mon, 12 Oct 2026 12:00:00 GMT",
        },
      }),
  );

  await store.read("key");

  assert.equal(requests[0].headers["accept-encoding"], "identity");
  assert.doesNotMatch(requests[0].headers.authorization, /accept-encoding/);
});

test("drops the weak prefix Cloudflare puts on the ETag of a recompressed lock", async () => {
  const { store } = createStore(
    () =>
      new Response(JSON.stringify(record), {
        status: 200,
        headers: {
          etag: 'W/"etag-2"',
          date: "Mon, 12 Oct 2026 12:02:30 GMT",
          "last-modified": "Mon, 12 Oct 2026 12:00:00 GMT",
        },
      }),
  );

  assert.equal((await store.read("key"))?.etag, '"etag-2"');
});

test("treats a missing object as no lock", async () => {
  const { store } = createStore(() => new Response("NoSuchKey", { status: 404 }));

  assert.equal(await store.read("key"), undefined);
});

test("marks an R2 failure that retrying cannot fix as fatal", async () => {
  const { store } = createStore(() => new Response("AccessDenied", { status: 403 }));

  await assert.rejects(store.create("key", record), {
    name: "BroadcastLockStoreFatalError",
    message: /R2 PUT .* failed with 403: AccessDenied/,
  });
});

for (const status of [429, 503]) {
  test(`leaves an R2 ${status} retryable`, async () => {
    const { store } = createStore(() => new Response("SlowDown", { status }));

    await assert.rejects(store.read("key"), (error: Error) => {
      assert.equal(error.name, "Error");
      assert.match(error.message, new RegExp(`failed with ${status}`));
      return true;
    });
  });
}

test("refuses to treat an unrelated object as a lock", async () => {
  const { store } = createStore(
    () =>
      new Response(JSON.stringify({ hello: "world" }), { status: 200, headers: { etag: '"x"' } }),
  );

  await assert.rejects(store.read("key"), {
    name: "BroadcastLockStoreFatalError",
    message: /is not a lock record/,
  });
});

test("refuses an object that is not JSON as a lock", async () => {
  const { store } = createStore(
    () => new Response("<html>gateway</html>", { status: 200, headers: { etag: '"x"' } }),
  );

  await assert.rejects(store.read("key"), { name: "BroadcastLockStoreFatalError" });
});

test("gives up on a request that stalls past its timeout", async () => {
  const stalledFetch = ((_input: URL | RequestInfo, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    })) as typeof fetch;
  const store = createR2LockStore({
    endpoint: "account.r2.cloudflarestorage.com",
    bucket: "ledger-live-cache",
    prefix: "e2e-broadcast-locks/",
    credentials: { accessKeyId: "key-id", secretAccessKey: "secret" },
    requestTimeoutMs: 20,
    fetchImpl: stalledFetch,
  });

  await assert.rejects(store.replace("key", record, '"etag-1"'), { name: "TimeoutError" });
});

test("accepts an endpoint given with its scheme", async () => {
  const { store, requests } = createStore(
    () => new Response(null, { status: 200, headers: { etag: '"etag-1"' } }),
    "https://account.r2.cloudflarestorage.com",
  );

  await store.create("key", record);

  assert.match(
    requests[0].url,
    /^https:\/\/account\.r2\.cloudflarestorage\.com\/ledger-live-cache\//,
  );
});
