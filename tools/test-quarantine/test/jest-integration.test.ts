import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * End-to-end cover for the jest adapter: a real jest process, loading the real
 * reporter through the package's `exports`, against a test that genuinely fails
 * and then passes.
 *
 * This is the test that pins the contract the reporter depends on — that
 * jest-circus reports each attempt separately, with a 1-based `invocations`
 * count — so an upstream change to that behaviour fails here rather than
 * silently reducing every flake to `retryCount: 0`.
 */

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * The jest CLI to drive the fixture with.
 *
 * Normally resolved from this package's own devDependency. The override exists
 * so the suite can run against the workspace's installed jest before this
 * package has been installed itself.
 */
function resolveJestBin(): string | undefined {
  if (process.env.TEST_QUARANTINE_JEST_BIN) return process.env.TEST_QUARANTINE_JEST_BIN;
  try {
    return createRequire(import.meta.url).resolve("jest/bin/jest");
  } catch {
    return undefined;
  }
}

interface IngestRequest {
  apiKey: string | undefined;
  events: { testTitle: string; file: string; retryCount: number; errorMessage: string }[];
}

/** A stand-in for the ingest API that records what the reporter sent it. */
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
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      requests.push({
        apiKey: req.headers["x-api-key"] as string | undefined,
        events: body.events,
      });
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
 * A consumer package laid out the way pnpm lays out a workspace dependency: the
 * package is a symlink into the repo, not a copy inside node_modules. That
 * distinction matters — Node refuses to strip types from files whose real path
 * is under node_modules, so a copied package would fail to load the reporter.
 */
function createFixtureProject(): { root: string; counterFile: string } {
  const root = mkdtempSync(join(tmpdir(), "tq-jest-integration-"));
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(join(root, "node_modules", "@ledgerhq"), { recursive: true });
  symlinkSync(packageRoot, join(root, "node_modules", "@ledgerhq", "test-quarantine"), "dir");

  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture", version: "1.0.0", private: true }, null, 2),
  );
  writeFileSync(
    join(root, "jest.config.js"),
    [
      "module.exports = {",
      "  rootDir: __dirname,",
      '  testEnvironment: "node",',
      '  testMatch: ["<rootDir>/src/**/*.test.js"],',
      '  setupFilesAfterEnv: ["<rootDir>/setup.js"],',
      '  reporters: ["@ledgerhq/test-quarantine/jest"],',
      "};",
      "",
    ].join("\n"),
  );
  writeFileSync(join(root, "setup.js"), "jest.retryTimes(2);\n");

  const counterFile = join(root, "attempts.txt");
  writeFileSync(counterFile, "0");
  writeFileSync(
    join(root, "src", "flaky.test.js"),
    [
      'const fs = require("node:fs");',
      "describe('payments', () => {",
      "  test('settles eventually', () => {",
      `    const file = ${JSON.stringify(counterFile)};`,
      '    const attempt = Number(fs.readFileSync(file, "utf8"));',
      "    fs.writeFileSync(file, String(attempt + 1));",
      '    if (attempt < 1) throw new Error("not settled yet");',
      "    expect(attempt).toBe(1);",
      "  });",
      "  test('is stable', () => { expect(1).toBe(1); });",
      "});",
      "",
    ].join("\n"),
  );

  return { root, counterFile };
}

/**
 * Runs jest and returns its exit code plus everything it printed.
 *
 * The output must be drained: an unread pipe blocks the child once it fills, and
 * `node --test` has no default timeout, so that would hang the suite rather than
 * fail it. Returning the output also makes a failed assertion diagnosable.
 */
async function runJest(
  jestBin: string,
  root: string,
  env: NodeJS.ProcessEnv,
): Promise<{ code: number; output: string }> {
  const child = spawn(process.execPath, [jestBin, "--config", join(root, "jest.config.js")], {
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

const jestBin = resolveJestBin();
const skip = jestBin ? false : "jest is not installed; run pnpm install for this package";

test("a real jest run reports a genuinely flaky test", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject();

  try {
    const { code, output } = await runJest(jestBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 0, output || "the retried test passes, so the run is green");
    assert.equal(ingest.requests.length, 1, "exactly one ingest request");

    const { events, apiKey } = ingest.requests[0];
    assert.equal(apiKey, "test-key");
    assert.equal(events.length, 1, "only the flaky test is reported");

    const [flake] = events;
    assert.equal(flake.testTitle, "payments settles eventually");
    assert.equal(flake.file, "src/flaky.test.js", "reported relative to the repo root");
    assert.equal(flake.retryCount, 1, "passed on the first retry");
    assert.match(flake.errorMessage, /not settled yet/);
  } finally {
    await ingest.close();
  }
});

test("a real jest run reports nothing when no test is retried", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root, counterFile } = createFixtureProject();
  // Start past the failing attempt so the test passes first time.
  writeFileSync(counterFile, "1");

  try {
    const { code, output } = await runJest(jestBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 0, output);
    assert.equal(ingest.requests.length, 0, "a clean run posts nothing");
  } finally {
    await ingest.close();
  }
});

test("a real jest run outside CI posts nothing", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject();

  try {
    await runJest(jestBin as string, root, {
      CI: "",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(ingest.requests.length, 0, "local runs never report");
  } finally {
    await ingest.close();
  }
});

test("the reporter does not change which tests jest runs", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject();

  try {
    const listed = await new Promise<string>(resolve => {
      const child = spawn(
        process.execPath,
        [jestBin as string, "--config", join(root, "jest.config.js"), "--listTests"],
        { cwd: root, env: { ...process.env, CI: "" }, stdio: ["ignore", "pipe", "ignore"] },
      );
      let out = "";
      child.stdout.on("data", chunk => {
        out += chunk;
      });
      child.on("close", () => resolve(out));
    });

    assert.match(listed, /flaky\.test\.js/);
    assert.equal(
      listed.trim().split("\n").filter(Boolean).length,
      1,
      "collection is untouched by the reporter",
    );
  } finally {
    await ingest.close();
  }
});

test("a real jest run stays green when the ingest API returns 500", { skip }, async () => {
  const ingest = await startIngestStub(500);
  const { root } = createFixtureProject();

  try {
    const { code, output } = await runJest(jestBin as string, root, {
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

test("a real jest run stays green when nothing is listening", { skip }, async () => {
  const { root } = createFixtureProject();

  // Port 9 (discard) refuses connections.
  const { code, output } = await runJest(jestBin as string, root, {
    CI: "true",
    FLAKE_API_KEY: "test-key",
    FLAKE_API_HOST: "http://127.0.0.1:9",
    QUARANTINE_REPO_ROOT: root,
  });

  assert.equal(code, 0, output || "an unreachable ingest API must never fail a test run");
});

test("a real jest run stays green when the host is malformed", { skip }, async () => {
  const { root } = createFixtureProject();

  const { code, output } = await runJest(jestBin as string, root, {
    CI: "true",
    FLAKE_API_KEY: "test-key",
    FLAKE_API_HOST: "definitely not a url",
    QUARANTINE_REPO_ROOT: root,
  });

  assert.equal(code, 0, output || "a misconfigured host must never fail a test run");
});

test("same-titled cases are not reported as a flake by a real jest run", { skip }, async () => {
  const ingest = await startIngestStub();
  const { root } = createFixtureProject();

  // test.each with a static title: one fullName, two cases, one failing for real.
  writeFileSync(
    join(root, "src", "flaky.test.js"),
    [
      "describe('wallet', () => {",
      "  test.each([false, true])('balance is right', ok => {",
      "    expect(ok).toBe(true);",
      "  });",
      "});",
      "",
    ].join("\n"),
  );

  try {
    const { code, output } = await runJest(jestBin as string, root, {
      CI: "true",
      FLAKE_API_KEY: "test-key",
      FLAKE_API_HOST: ingest.url,
      QUARANTINE_REPO_ROOT: root,
    });

    assert.equal(code, 1, output || "the hard failure still fails the run");
    assert.equal(ingest.requests.length, 0, "and is not reported as a flake");
  } finally {
    await ingest.close();
  }
});
