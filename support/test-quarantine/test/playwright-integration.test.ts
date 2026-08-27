import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * End-to-end cover for the Playwright adapter: a real `playwright test` process
 * loading the real reporter through the package's `exports`, against a spec that
 * genuinely fails and then passes.
 *
 * This pins the API shapes the adapter reads — `TestResult.retry`,
 * `Suite.type`, `TestCase.expectedStatus`, `TestCase.results` — so an upstream
 * change surfaces here rather than as silently missing flake reports.
 *
 * No browser is launched: the fixture specs never touch the `page` fixture, so
 * this runs anywhere without `playwright install`.
 */

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

/** Fixture roots to remove when the suite finishes; each holds symlinks into the repo. */
const fixtureRoots: string[] = [];
test.after(() => {
  for (const root of fixtureRoots) rmSync(root, { recursive: true, force: true });
});

function resolvePlaywrightBin(): string | undefined {
  if (process.env.TEST_QUARANTINE_PLAYWRIGHT_BIN) {
    return process.env.TEST_QUARANTINE_PLAYWRIGHT_BIN;
  }
  try {
    return createRequire(import.meta.url).resolve("@playwright/test/cli");
  } catch {
    return undefined;
  }
}

const playwrightBin = resolvePlaywrightBin();
const skip = playwrightBin
  ? false
  : "@playwright/test is not installed; run pnpm install for this package";

interface IngestRequest {
  events: { testTitle: string; file: string; retryCount: number; errorMessage: string }[];
}

async function startIngestStub(status = 200): Promise<{
  url: string;
  requests: IngestRequest[];
  close: () => Promise<void>;
}> {
  const requests: IngestRequest[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => {
      requests.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      res.writeHead(status, { "content-type": "application/json" });
      res.end("{}");
    });
  });

  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise<void>(resolve => server.close(() => resolve())),
  };
}

/**
 * A consumer project laid out as pnpm lays out a workspace dependency: the
 * package is symlinked, not copied, so Node will strip types from its `.ts`.
 */
function createFixtureProject(spec: string, retries = 1): { root: string; counterFile: string } {
  const root = mkdtempSync(join(tmpdir(), "tq-pw-integration-"));
  fixtureRoots.push(root);
  mkdirSync(join(root, "specs"), { recursive: true });
  mkdirSync(join(root, "node_modules", "@ledgerhq"), { recursive: true });
  mkdirSync(join(root, "node_modules", "@playwright"), { recursive: true });
  symlinkSync(packageRoot, join(root, "node_modules", "@ledgerhq", "test-quarantine"), "dir");
  // The specs `require("@playwright/test")`, so the fixture needs it resolvable.
  // Derived from the CLI we are about to run, so both always agree on a version.
  symlinkSync(
    dirname(playwrightBin as string),
    join(root, "node_modules", "@playwright", "test"),
    "dir",
  );

  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "pw-fixture", version: "1.0.0", private: true }, null, 2),
  );
  writeFileSync(
    join(root, "playwright.config.js"),
    [
      "module.exports = {",
      `  testDir: "./specs",`,
      `  retries: ${retries},`,
      `  reporter: [["@ledgerhq/test-quarantine/playwright"]],`,
      "};",
      "",
    ].join("\n"),
  );

  const counterFile = join(root, "attempts.txt");
  writeFileSync(counterFile, "0");
  writeFileSync(join(root, "specs", "a.spec.js"), spec.replace("__COUNTER__", counterFile));

  return { root, counterFile };
}

/**
 * Playwright starts a fresh worker process for every retry, so a module-scoped
 * counter would reset. The attempt count has to live on disk.
 */
const FLAKY_SPEC = `
const fs = require("node:fs");
const { test, expect } = require("@playwright/test");

test.describe("payments", () => {
  test("settles eventually", () => {
    const file = ${JSON.stringify("__COUNTER__")};
    const attempt = Number(fs.readFileSync(file, "utf8"));
    fs.writeFileSync(file, String(attempt + 1));
    if (attempt < 1) throw new Error("not settled yet");
    expect(attempt).toBe(1);
  });

  test("is stable", () => {
    expect(1).toBe(1);
  });
});
`;

const ALWAYS_FAILS_SPEC = `
const { test, expect } = require("@playwright/test");
test("never works", () => {
  expect(1).toBe(2);
});
`;

const EXPECTED_FAILURE_SPEC = `
const { test, expect } = require("@playwright/test");
test("known broken", () => {
  test.fail();
  expect(1).toBe(2);
});
`;

/**
 * Runs Playwright and returns its exit code plus everything it printed.
 *
 * The output must be drained: an unread pipe blocks the child once it fills, and
 * `node --test` has no default timeout, so that would hang the suite rather than
 * fail it. Returning the output also makes a failed assertion diagnosable.
 */
async function runPlaywright(
  bin: string,
  root: string,
  env: NodeJS.ProcessEnv,
): Promise<{ code: number; output: string }> {
  const child = spawn(process.execPath, [bin, "test"], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout.on("data", chunk => (output += chunk));
  child.stderr.on("data", chunk => (output += chunk));

  const code = await new Promise<number>(resolve => child.on("close", c => resolve(c ?? 1)));
  return { code, output };
}

test("a real playwright run reports a genuinely flaky test", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject(FLAKY_SPEC);

  try {
    const { code, output } = await runPlaywright(playwrightBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 0, output || "the retried test passes, so the run is green");
    assert.equal(ingest.requests.length, 1, "exactly one ingest request");

    const { events } = ingest.requests[0];
    assert.equal(events.length, 1, "only the flaky test is reported");

    const [flake] = events;
    assert.equal(flake.testTitle, "payments settles eventually", "describes plus title");
    assert.equal(flake.file, "specs/a.spec.js", "reported relative to the repo root");
    assert.equal(flake.retryCount, 1, "passed on the first retry");
    assert.match(flake.errorMessage, /not settled yet/);
    assert.ok(!flake.errorMessage.includes("\n    at "), "stack frames are stripped");
  } finally {
    await ingest.close();
  }
});

test("a real playwright run reports nothing when a test just fails", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject(ALWAYS_FAILS_SPEC);

  try {
    const { code, output } = await runPlaywright(playwrightBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 1, output || "a hard failure still fails the run");
    assert.equal(ingest.requests.length, 0, "and is not reported as a flake");
  } finally {
    await ingest.close();
  }
});

test("a test declared with test.fail() is not reported", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject(EXPECTED_FAILURE_SPEC);

  try {
    await runPlaywright(playwrightBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(ingest.requests.length, 0, "an expected failure is not a flake");
  } finally {
    await ingest.close();
  }
});

test("a real playwright run reports nothing with retries disabled", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject(FLAKY_SPEC, 0);

  try {
    const { code, output } = await runPlaywright(playwrightBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 1, output || "without a retry the flake is just a failure");
    assert.equal(ingest.requests.length, 0);
  } finally {
    await ingest.close();
  }
});

test("a real playwright run stays green when the ingest API fails", { skip }, async () => {
  const ingest = await startIngestStub(500);
  const { root } = createFixtureProject(FLAKY_SPEC);

  try {
    const { code, output } = await runPlaywright(playwrightBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 0, output || "a broken ingest API must never fail a test run");
    assert.equal(ingest.requests.length, 1, "it did try");
  } finally {
    await ingest.close();
  }
});

test("two projects flaking on the same spec each get reported", { skip }, async () => {
  const ingest = await startIngestStub();
  const root = mkdtempSync(join(tmpdir(), "tq-pw-projects-"));
  fixtureRoots.push(root);
  mkdirSync(join(root, "specs"), { recursive: true });
  mkdirSync(join(root, "node_modules", "@ledgerhq"), { recursive: true });
  mkdirSync(join(root, "node_modules", "@playwright"), { recursive: true });
  symlinkSync(packageRoot, join(root, "node_modules", "@ledgerhq", "test-quarantine"), "dir");
  symlinkSync(
    dirname(playwrightBin as string),
    join(root, "node_modules", "@playwright", "test"),
    "dir",
  );
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "pw-projects", version: "1.0.0", private: true }, null, 2),
  );
  writeFileSync(
    join(root, "playwright.config.js"),
    [
      "module.exports = {",
      "  retries: 1,",
      "  projects: [",
      '    { name: "alpha", testDir: "./specs" },',
      '    { name: "beta", testDir: "./specs" },',
      "  ],",
      '  reporter: [["@ledgerhq/test-quarantine/playwright"]],',
      "};",
      "",
    ].join("\n"),
  );
  // A counter per project, so both projects genuinely flake.
  writeFileSync(
    join(root, "specs", "a.spec.js"),
    [
      'const fs = require("node:fs");',
      'const path = require("node:path");',
      'const { test, expect } = require("@playwright/test");',
      'test("settles eventually", ({}, testInfo) => {',
      `  const file = path.join(${JSON.stringify(root)}, "c-" + testInfo.project.name + ".txt");`,
      '  const n = fs.existsSync(file) ? Number(fs.readFileSync(file, "utf8")) : 0;',
      "  fs.writeFileSync(file, String(n + 1));",
      '  if (n === 0) throw new Error("first attempt fails in " + testInfo.project.name);',
      "  expect(n).toBe(1);",
      "});",
      "",
    ].join("\n"),
  );

  try {
    const { code, output } = await runPlaywright(playwrightBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 0, output);
    const events = ingest.requests.flatMap(request => request.events);
    assert.equal(events.length, 2, `expected one flake per project\n${output}`);
    assert.deepEqual(
      events.map(event => event.errorMessage.split("\n")[0]).sort(),
      ["Error: first attempt fails in alpha", "Error: first attempt fails in beta"],
      "each project reports its own failure",
    );
  } finally {
    await ingest.close();
  }
});
