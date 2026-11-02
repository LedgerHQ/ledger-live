import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after, mock } from "node:test";
import {
  accountLockKey,
  acquireExclusiveLock,
  exclusiveLockStoreFailure,
  PAY_CARD,
  refuseExclusiveLocks,
  runWithExclusiveLock,
  takeExclusiveLockWaitedMs,
  tryAcquireExclusiveLock,
} from "./exclusiveLock";
import { Account, TokenAccount } from "./enum/Account";

type Env = Record<string, string | undefined>;

const NO_REMOTE_LOCK: Env = {
  CI: undefined,
  E2E_EXCLUSIVE_LOCK_ENDPOINT: undefined,
  E2E_EXCLUSIVE_LOCK_BUCKET: undefined,
  E2E_EXCLUSIVE_LOCK_ACCESS_KEY_ID: undefined,
  E2E_EXCLUSIVE_LOCK_SECRET_ACCESS_KEY: undefined,
};

const REMOTE_LOCK: Env = {
  E2E_EXCLUSIVE_LOCK_ENDPOINT: "account.r2.cloudflarestorage.com",
  E2E_EXCLUSIVE_LOCK_BUCKET: "ledger-live-cache",
  E2E_EXCLUSIVE_LOCK_ACCESS_KEY_ID: "key-id",
  E2E_EXCLUSIVE_LOCK_SECRET_ACCESS_KEY: "secret",
};

const lockDirs = mkdtempSync(path.join(os.tmpdir(), "exclusive-lock-test-"));
after(() => rmSync(lockDirs, { recursive: true, force: true }));
let lockDirCount = 0;

// Each run gets a machine-local lock directory of its own, so no settle window an earlier test
// left delays it.
const withEnv = async (runEnv: Env, fn: () => Promise<void>) => {
  const env = { ...runEnv, TMPDIR: path.join(lockDirs, String(++lockDirCount)) };
  const previous = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  const apply = (values: Env) => {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
  apply(env);
  try {
    await fn();
  } finally {
    apply(previous);
  }
};

const mockR2 = () => {
  const requests: Array<{ method: string; headers: Record<string, string>; body: unknown }> = [];
  const fetchMock = mock.method(globalThis, "fetch", async (_url: URL, init: RequestInit) => {
    const method = init.method ?? "GET";
    requests.push({
      method,
      headers: { ...(init.headers as Record<string, string>) },
      body: method === "PUT" ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(null, { status: 200, headers: { etag: `"etag-${requests.length}"` } });
  });
  return { requests, restore: () => fetchMock.mock.restore() };
};

const mockR2WithHeldAccounts = (heldAccounts: Account[]) => {
  const heldKeys = new Set(heldAccounts.map(account => accountLockKey(account)));
  const requests: Array<{ method: string; key: string; body: unknown }> = [];
  const fetchMock = mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    const method = init.method ?? "GET";
    const key = Buffer.from(
      url.pathname
        .split("/")
        .pop()!
        .replace(/\.json$/, ""),
      "base64url",
    ).toString();
    requests.push({
      method,
      key,
      body: method === "PUT" ? JSON.parse(String(init.body)) : undefined,
    });
    if (!heldKeys.has(key)) {
      return method === "GET"
        ? new Response("NoSuchKey", { status: 404 })
        : new Response(null, { status: 200, headers: { etag: `"${key}-${requests.length}"` } });
    }
    if (method === "PUT") return new Response("PreconditionFailed", { status: 412 });
    const now = new Date().toUTCString();
    return new Response(
      JSON.stringify({
        holder: "android-runner",
        label: "android sendETH.spec.ts",
        leaseMs: 120_000,
        settleMs: 45_000,
        released: false,
      }),
      { status: 200, headers: { etag: '"held"', date: now, "last-modified": now } },
    );
  });
  return { requests, restore: () => fetchMock.mock.restore() };
};

test("keys a token account on its parent account, where its nonce lives", () => {
  assert.equal(accountLockKey(TokenAccount.ETH_USDT_1), accountLockKey(Account.ETH_1));
});

test("keys the same derivation path on two chains apart", () => {
  assert.equal(Account.ATOM_1.accountPath, Account.BABY_1.accountPath);
  assert.notEqual(accountLockKey(Account.ATOM_1), accountLockKey(Account.BABY_1));
});

const deferred = () => {
  let resolve = () => {};
  const promise = new Promise<void>(settle => {
    resolve = settle;
  });
  return { promise, resolve };
};

test(
  "lets a spec that holds an account call a helper that locks it again",
  { timeout: 10_000 },
  async () => {
    const steps: string[] = [];

    await withEnv(NO_REMOTE_LOCK, async () => {
      const spec = await acquireExclusiveLock([Account.ETH_1], "ios approval.spec.ts", {
        allowNested: true,
      });
      await runWithExclusiveLock([TokenAccount.ETH_USDT_1], "token approve", async () => {
        steps.push("nested");
      });
      await spec.release();
    });

    assert.deepEqual(steps, ["nested"]);
  },
);

test("waits for broadcasts nested in a lock before releasing it", { timeout: 10_000 }, async () => {
  const steps: string[] = [];

  await withEnv(NO_REMOTE_LOCK, async () => {
    const spec = await acquireExclusiveLock([Account.ETH_1], "ios approval.spec.ts", {
      allowNested: true,
    });
    const approvalStarted = deferred();
    const approvalMayFinish = deferred();
    const approval = runWithExclusiveLock([TokenAccount.ETH_USDT_1], "token approve", async () => {
      approvalStarted.resolve();
      await approvalMayFinish.promise;
      steps.push("approval done");
    });
    await approvalStarted.promise;

    const specReleased = spec.release().then(() => steps.push("spec released"));
    await new Promise(resolve => setTimeout(resolve, 50));
    approvalMayFinish.resolve();
    await Promise.all([approval, specReleased]);
  });

  assert.deepEqual(steps, ["approval done", "spec released"]);
});

test(
  "waits for broadcasts nested in a lock before abandoning it",
  { timeout: 10_000 },
  async () => {
    const steps: string[] = [];

    await withEnv(NO_REMOTE_LOCK, async () => {
      const spec = await acquireExclusiveLock([Account.ETH_1], "desktop provider.swap", {
        allowNested: true,
      });
      const approvalStarted = deferred();
      const approvalMayFinish = deferred();
      const approval = runWithExclusiveLock(
        [TokenAccount.ETH_USDT_1],
        "token approve",
        async () => {
          approvalStarted.resolve();
          await approvalMayFinish.promise;
          steps.push("approval done");
        },
        { waitsForConfirmation: true },
      );
      await approvalStarted.promise;

      const specAbandoned = spec.abandon().then(() => steps.push("spec abandoned"));
      await new Promise(resolve => setTimeout(resolve, 50));
      approvalMayFinish.resolve();
      await Promise.all([approval, specAbandoned]);
    });

    assert.deepEqual(steps, ["approval done", "spec abandoned"]);
  },
);

test(
  "lets a nested call lock the account again while its lock waits for it",
  { timeout: 10_000 },
  async () => {
    const steps: string[] = [];

    await withEnv(NO_REMOTE_LOCK, async () => {
      const spec = await acquireExclusiveLock([Account.ETH_1], "desktop provider.swap", {
        allowNested: true,
      });
      const revokeStarted = deferred();
      const revokeMayContinue = deferred();
      const revoke = runWithExclusiveLock([TokenAccount.ETH_USDT_1], "token revoke", async () => {
        revokeStarted.resolve();
        await revokeMayContinue.promise;
        await runWithExclusiveLock([TokenAccount.ETH_USDT_1], "token approve", async () => {
          steps.push("approval");
        });
      });
      await revokeStarted.promise;

      const specReleased = spec.release().then(() => steps.push("spec released"));
      revokeMayContinue.resolve();
      await Promise.all([revoke, specReleased]);
    });

    assert.deepEqual(steps, ["approval", "spec released"]);
  },
);

test("does not let a call join a lock whose release has started", { timeout: 10_000 }, async () => {
  const steps: string[] = [];

  await withEnv(NO_REMOTE_LOCK, async () => {
    const spec = await acquireExclusiveLock([Account.ETH_1], "ios approval.spec.ts", {
      allowNested: true,
    });
    const specAbandoned = spec.abandon().then(() => steps.push("spec abandoned"));
    await runWithExclusiveLock([TokenAccount.ETH_USDT_1], "late approval", async () => {
      steps.push("late approval");
    });
    await specAbandoned;
  });

  assert.deepEqual(steps, ["spec abandoned", "late approval"]);
});

test(
  "fails a broadcast at once on an account its spec could not lock, until that spec ends",
  { timeout: 10_000 },
  async () => {
    await withEnv(NO_REMOTE_LOCK, async () => {
      const refusal = refuseExclusiveLocks(
        [Account.ETH_4],
        "could not be locked by ios borrow.spec.ts",
      );
      await assert.rejects(
        runWithExclusiveLock([TokenAccount.ETH_USDT_4], "token revoke", async () => {}),
        {
          name: "ExclusiveLockRefusedError",
          message: /could not be locked by ios borrow\.spec\.ts/,
        },
      );
      await refusal.release();

      await runWithExclusiveLock([TokenAccount.ETH_USDT_4], "token revoke", async () => {});
    });
  },
);

for (const allowNested of [false, true]) {
  test(
    `waits for a${allowNested ? " spec" : ""} lock left running by an earlier spec instead of joining it`,
    { timeout: 10_000 },
    async () => {
      const steps: string[] = [];

      await withEnv(NO_REMOTE_LOCK, async () => {
        const earlier = await acquireExclusiveLock([Account.ETH_1], "timed out spec", {
          allowNested,
        });
        const next = acquireExclusiveLock([Account.ETH_1], "next spec", {
          allowNested: true,
        }).then(lease => {
          steps.push("next spec acquired");
          return lease;
        });

        await new Promise(resolve => setTimeout(resolve, 300));
        steps.push("earlier abandoned");
        await earlier.abandon();
        await (await next).abandon();
      });

      assert.deepEqual(steps, ["earlier abandoned", "next spec acquired"]);
    },
  );
}

test(
  "adds up the time spent waiting for locks until it is taken",
  { timeout: 10_000 },
  async () => {
    await withEnv(NO_REMOTE_LOCK, async () => {
      takeExclusiveLockWaitedMs();
      const earlier = await acquireExclusiveLock([Account.ETH_1], "earlier spec");
      const next = acquireExclusiveLock([Account.ETH_1], "next spec");
      await new Promise(resolve => setTimeout(resolve, 300));
      await earlier.abandon();
      await (await next).abandon();
    });

    assert.ok(takeExclusiveLockWaitedMs() >= 300);
    assert.equal(takeExclusiveLockWaitedMs(), 0);
  },
);

test("locks each on-chain account once when several share it", { timeout: 10_000 }, async () => {
  await withEnv(NO_REMOTE_LOCK, async () => {
    const lease = await acquireExclusiveLock(
      [TokenAccount.ETH_USDT_1, Account.ETH_1, Account.ATOM_1],
      "multi-account flow",
    );
    await lease.abandon();
    await lease.abandon();

    await runWithExclusiveLock([Account.ETH_1], "next flow", async () => {});
  });
});

test("refuses a partial remote configuration", async () => {
  await withEnv(
    { ...NO_REMOTE_LOCK, E2E_EXCLUSIVE_LOCK_ENDPOINT: "account.r2.cloudflarestorage.com" },
    async () => {
      await assert.rejects(
        acquireExclusiveLock([Account.DOT_1], "partial config"),
        /must be set together/,
      );
    },
  );
});

test("refuses to fall back to a machine-local lock on CI", async () => {
  await withEnv({ ...NO_REMOTE_LOCK, CI: "true" }, async () => {
    await assert.rejects(acquireExclusiveLock([Account.DOT_1], "CI without remote locking"), {
      name: "ExclusiveLockConfigError",
    });
    await assert.rejects(tryAcquireExclusiveLock([Account.DOT_1], "CI without remote locking"), {
      name: "ExclusiveLockConfigError",
    });
  });
});

test("locks on this machine only, even on CI, when told to", async () => {
  const r2 = mockR2();
  try {
    await withEnv({ ...REMOTE_LOCK, CI: "true", E2E_EXCLUSIVE_LOCK_MODE: "local" }, async () => {
      await runWithExclusiveLock([Account.DOT_1], "R2 down", async () => {});
    });
    assert.equal(r2.requests.length, 0);
  } finally {
    r2.restore();
  }
});

/** The settle windows machine-local releases left in this run's lock directory, by key. */
const machineLocalSettleWindows = () => {
  const lockRoot = path.join(os.tmpdir(), "ll-e2e-locks");
  return readdirSync(lockRoot)
    .filter(name => name.endsWith(".settled-until"))
    .map(name => ({
      key: Buffer.from(name.split(".")[0], "base64url").toString(),
      leftMs: Number(readFileSync(path.join(lockRoot, name), "utf8")) - Date.now(),
    }));
};

test("keeps the settle window on this machine only after a broadcast from an account", async () => {
  await withEnv({ ...REMOTE_LOCK, CI: "true", E2E_EXCLUSIVE_LOCK_MODE: "local" }, async () => {
    await (await acquireExclusiveLock([Account.ETH_1], "R2 down, broadcast")).release();
    await (await acquireExclusiveLock([Account.SOL_1], "R2 down, nothing broadcast")).abandon();
    await (await acquireExclusiveLock([PAY_CARD], "R2 down, card frozen")).release();

    const [ethSettle, ...others] = machineLocalSettleWindows();
    assert.equal(ethSettle?.key, accountLockKey(Account.ETH_1));
    assert.ok(ethSettle.leftMs > 40_000 && ethSettle.leftMs <= 45_000);
    assert.deepEqual(others, []);
  });
});

test("refuses an unknown lock mode", async () => {
  await withEnv({ ...NO_REMOTE_LOCK, E2E_EXCLUSIVE_LOCK_MODE: "off" }, async () => {
    await assert.rejects(acquireExclusiveLock([Account.DOT_1], "unknown mode"), {
      name: "ExclusiveLockConfigError",
    });
  });
});

test("refuses an unknown lock priority", async () => {
  await withEnv({ ...NO_REMOTE_LOCK, E2E_EXCLUSIVE_LOCK_PRIORITY: "urgent" }, async () => {
    await assert.rejects(acquireExclusiveLock([Account.DOT_1], "unknown priority"), {
      name: "ExclusiveLockConfigError",
      message: /E2E_EXCLUSIVE_LOCK_PRIORITY must be "normal" or "high"/,
    });
  });
});

type R2Request = {
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
};

const mockR2Responses = (respond: (request: R2Request, call: number) => Response) => {
  const requests: R2Request[] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (_url: URL, init: RequestInit) => {
    const request = {
      method: init.method ?? "GET",
      headers: { ...(init.headers as Record<string, string>) },
    };
    requests.push(request);
    return respond(request, requests.length);
  });
  return { requests, restore: () => fetchMock.mock.restore() };
};

const noSleep = async () => {};

const written = () => new Response(null, { status: 200, headers: { etag: '"written"' } });

/** R2 holding the check key another job wrote, then answering its replacement with `status`. */
const checkKeyStored =
  (replaceStatus: number) =>
  ({ method, headers }: R2Request) => {
    if (headers["if-none-match"] === "*")
      return new Response("PreconditionFailed", { status: 412 });
    if (method === "PUT")
      return replaceStatus === 200 ? written() : new Response(null, { status: replaceStatus });
    const now = new Date().toUTCString();
    return new Response(
      JSON.stringify({
        holder: "android-runner",
        label: "lock store check",
        leaseMs: 0,
        settleMs: 0,
        released: true,
      }),
      { status: 200, headers: { etag: '"stored"', date: now, "last-modified": now } },
    );
  };

const conditions = (requests: readonly R2Request[]) =>
  requests.map(({ method, headers }) => [
    method,
    headers["if-none-match"] ?? headers["if-match"] ?? "",
  ]);

test("finds the lock store taking locks when it creates its check key", async () => {
  const r2 = mockR2Responses(written);
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.equal(await exclusiveLockStoreFailure({ sleep: noSleep }), undefined);
    });
    assert.deepEqual(conditions(r2.requests), [["PUT", "*"]]);
  } finally {
    r2.restore();
  }
});

test("finds the lock store taking locks when it replaces its check key", async () => {
  const r2 = mockR2Responses(checkKeyStored(200));
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.equal(await exclusiveLockStoreFailure({ sleep: noSleep }), undefined);
    });
    assert.deepEqual(conditions(r2.requests), [
      ["PUT", "*"],
      ["GET", ""],
      ["PUT", '"stored"'],
    ]);
  } finally {
    r2.restore();
  }
});

test("finds the lock store taking locks when another job's check replaced the key first", async () => {
  const r2 = mockR2Responses(checkKeyStored(412));
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.equal(await exclusiveLockStoreFailure({ sleep: noSleep }), undefined);
    });
    assert.equal(r2.requests.length, 3);
  } finally {
    r2.restore();
  }
});

test("finds the lock store taking locks once a retried request succeeds", async () => {
  const r2 = mockR2Responses((_request, call) =>
    call === 1 ? new Response(null, { status: 503 }) : written(),
  );
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.equal(await exclusiveLockStoreFailure({ sleep: noSleep }), undefined);
    });
    assert.equal(r2.requests.length, 2);
  } finally {
    r2.restore();
  }
});

test("reports at once a lock store that reads but refuses writes", async () => {
  const r2 = mockR2Responses(({ method }) =>
    method === "GET"
      ? checkKeyStored(200)({ method, headers: {} })
      : new Response("AccessDenied", { status: 403 }),
  );
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.match(
        (await exclusiveLockStoreFailure({ sleep: noSleep })) ?? "",
        /R2 PUT .* failed with 403/,
      );
    });
    assert.equal(r2.requests.length, 1);
  } finally {
    r2.restore();
  }
});

test("reports at once a missing bucket, which R2 answers with a 404 like a missing key", async () => {
  const r2 = mockR2Responses(
    () => new Response("<Error><Code>NoSuchBucket</Code></Error>", { status: 404 }),
  );
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.match(
        (await exclusiveLockStoreFailure({ sleep: noSleep })) ?? "",
        /failed with 404: .*NoSuchBucket/,
      );
    });
    assert.equal(r2.requests.length, 1);
  } finally {
    r2.restore();
  }
});

test("reports why the lock store kept failing after retrying it", async () => {
  const r2 = mockR2Responses(() => {
    throw new TypeError("fetch failed", { cause: new Error("connect ECONNREFUSED") });
  });
  const sleeps: number[] = [];
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const failure = await exclusiveLockStoreFailure({
        sleep: async ms => {
          sleeps.push(ms);
        },
      });
      assert.equal(failure, "fetch failed: connect ECONNREFUSED");
    });
    assert.equal(r2.requests.length, 4);
    assert.equal(sleeps.length, 3);
  } finally {
    r2.restore();
  }
});

test("refuses to check the lock store without its configuration", async () => {
  await withEnv({ ...NO_REMOTE_LOCK, CI: "true" }, async () => {
    await assert.rejects(exclusiveLockStoreFailure({ sleep: noSleep }), {
      name: "ExclusiveLockConfigError",
    });
  });
});

test("claims and releases the account in R2 with high priority", async () => {
  const r2 = mockR2();
  try {
    await withEnv({ ...REMOTE_LOCK, E2E_EXCLUSIVE_LOCK_PRIORITY: "high" }, async () => {
      await runWithExclusiveLock([Account.XRP_1], "Send XRP from release", async () => {});
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(
    r2.requests.map(({ body }) => (body as { released: boolean }).released),
    [false, true],
  );
});

test("claims and releases the account in R2 when remote locking is configured", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      await runWithExclusiveLock([Account.XRP_1], "Send XRP", async () => {});
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(
    r2.requests.map(({ headers, body }) => [
      headers["if-none-match"] ?? headers["if-match"],
      (body as { released: boolean }).released,
    ]),
    [
      ["*", false],
      ['"etag-1"', true],
    ],
  );
});

test("keeps the settle window when abandoning a lock a nested call released", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const lease = await acquireExclusiveLock([Account.ETH_1], "desktop provider.swap", {
        allowNested: true,
      });
      await runWithExclusiveLock([TokenAccount.ETH_USDT_1], "token approve", async () => {});
      await lease.abandon();
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(
    r2.requests.map(({ body }) => {
      const { released, settleMs } = body as { released: boolean; settleMs: number };
      return { released, settleMs };
    }),
    [
      { released: false, settleMs: 45_000 },
      { released: true, settleMs: 45_000 },
    ],
  );
});

const settleWrites = (requests: Array<{ body: unknown }>) =>
  requests.map(({ body }) => {
    const { released, settleMs } = body as { released: boolean; settleMs: number };
    return { released, settleMs };
  });

test("hands the account back without the settle window after a confirmed broadcast", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      await runWithExclusiveLock([Account.ETH_1], "token approve", async () => {}, {
        waitsForConfirmation: true,
      });
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(settleWrites(r2.requests), [
    { released: false, settleMs: 45_000 },
    { released: true, settleMs: 0 },
  ]);
});

test("keeps the settle window when a broadcast meant to be confirmed fails", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      await assert.rejects(
        runWithExclusiveLock(
          [Account.ETH_1],
          "token approve",
          async () => {
            throw new Error("not confirmed in time");
          },
          { waitsForConfirmation: true },
        ),
        /not confirmed in time/,
      );
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(settleWrites(r2.requests), [
    { released: false, settleMs: 45_000 },
    { released: true, settleMs: 45_000 },
  ]);
});

test("abandons a lock without the settle window when its nested broadcasts were confirmed", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const lease = await acquireExclusiveLock([Account.ETH_1], "android swap.spec.ts", {
        allowNested: true,
      });
      await runWithExclusiveLock([TokenAccount.ETH_USDT_1], "token approve", async () => {}, {
        waitsForConfirmation: true,
      });
      await lease.abandon();
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(settleWrites(r2.requests), [
    { released: false, settleMs: 45_000 },
    { released: true, settleMs: 0 },
  ]);
});

test("hands the account back without the settle window when nothing was broadcast", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const lease = await acquireExclusiveLock([Account.ETH_1], "android swap.spec.ts");
      await lease.abandon();
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(
    r2.requests.map(({ body }) => {
      const { released, settleMs } = body as { released: boolean; settleMs: number };
      return { released, settleMs };
    }),
    [
      { released: false, settleMs: 45_000 },
      { released: true, settleMs: 0 },
    ],
  );
});

test("gives up at once on an account another holder has", async () => {
  const r2 = mockR2WithHeldAccounts([Account.ETH_1]);
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.equal(
        await tryAcquireExclusiveLock([TokenAccount.ETH_USDT_1], "ios paytab.spec.ts"),
        undefined,
      );
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(
    r2.requests.map(({ method }) => method),
    ["PUT", "GET"],
  );
});

test("hands back the accounts it got when another one is held", async () => {
  const r2 = mockR2WithHeldAccounts([Account.SOL_1]);
  try {
    await withEnv(REMOTE_LOCK, async () => {
      assert.equal(
        await tryAcquireExclusiveLock([Account.ADA_1, Account.SOL_1], "ios borrow.spec.ts"),
        undefined,
      );
    });
  } finally {
    r2.restore();
  }

  const adaWrites = r2.requests.filter(
    ({ method, key }) => method === "PUT" && key === accountLockKey(Account.ADA_1),
  );
  assert.deepEqual(
    adaWrites.map(({ body }) => {
      const { released, settleMs } = body as { released: boolean; settleMs: number };
      return { released, settleMs };
    }),
    [
      { released: false, settleMs: 45_000 },
      { released: true, settleMs: 0 },
    ],
  );
});

test("locks a shared resource under its own key, apart from the accounts", async () => {
  const r2 = mockR2WithHeldAccounts([Account.ETH_1]);
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const lease = await tryAcquireExclusiveLock([PAY_CARD], "ios paytabFreeze.spec.ts");
      assert.ok(lease);
      await lease.release();
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual([...new Set(r2.requests.map(({ key }) => key))], ["pay-card"]);
});

test("hands a shared resource back without the settle window", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const lease = await acquireExclusiveLock([PAY_CARD], "desktop paytab.spec.ts");
      await lease.release();
    });
  } finally {
    r2.restore();
  }

  assert.deepEqual(
    r2.requests.map(({ body }) => {
      const { released, settleMs } = body as { released: boolean; settleMs: number };
      return { released, settleMs };
    }),
    [
      { released: false, settleMs: 0 },
      { released: true, settleMs: 0 },
    ],
  );
});

test(
  "makes a second holder of a shared resource wait for the first",
  { timeout: 10_000 },
  async () => {
    const steps: string[] = [];

    await withEnv(NO_REMOTE_LOCK, async () => {
      const ios = await acquireExclusiveLock([PAY_CARD], "ios paytabFreeze.spec.ts");
      const android = acquireExclusiveLock([PAY_CARD], "android paytabFreeze.spec.ts").then(
        lease => {
          steps.push("android acquired");
          return lease;
        },
      );

      await new Promise(resolve => setTimeout(resolve, 300));
      steps.push("ios released");
      await ios.release();
      await (await android).release();
    });

    assert.deepEqual(steps, ["ios released", "android acquired"]);
  },
);

test("takes a free account without waiting", async () => {
  const r2 = mockR2WithHeldAccounts([]);
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const lease = await tryAcquireExclusiveLock([Account.XRP_1], "ios sendXRP.spec.ts");
      assert.ok(lease);
      await lease.release();
    });
  } finally {
    r2.restore();
  }
});

test("joins a lock this process is holding without asking R2 again", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const spec = await acquireExclusiveLock([Account.ETH_4], "ios borrow.spec.ts", {
        allowNested: true,
      });
      await runWithExclusiveLock([TokenAccount.ETH_USDT_4], "token revoke", async () => {});
      await spec.release();
    });
  } finally {
    r2.restore();
  }

  assert.equal(r2.requests.length, 2);
});

test("does not join a hold once it has been released", async () => {
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const spec = await acquireExclusiveLock([Account.SOL_1], "first spec", {
        allowNested: true,
      });
      await spec.release();
      await runWithExclusiveLock([Account.SOL_1], "later approval", async () => {});
    });
  } finally {
    r2.restore();
  }

  assert.equal(r2.requests.filter(({ headers }) => headers["if-none-match"] === "*").length, 2);
});

test("publishes joinable holds on node:os, the module every Jest context shares", async () => {
  const registryKey = Symbol.for("@ledgerhq/live-e2e-shared/exclusiveLock/liveHolds");
  const r2 = mockR2();
  try {
    await withEnv(REMOTE_LOCK, async () => {
      const spec = await acquireExclusiveLock([Account.ADA_1], "Send ADA", {
        allowNested: true,
      });
      const heldRegistry: unknown = Reflect.get(os, registryKey);
      assert.ok(typeof heldRegistry === "object" && heldRegistry !== null);
      assert.ok(accountLockKey(Account.ADA_1) in heldRegistry);
      await spec.release();
      const holds: unknown = Reflect.get(os, registryKey);
      assert.ok(typeof holds === "object" && holds !== null);
      assert.equal(accountLockKey(Account.ADA_1) in holds, false);
    });
  } finally {
    r2.restore();
  }
});
