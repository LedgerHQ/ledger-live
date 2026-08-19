import test from "node:test";
import assert from "node:assert/strict";
import { parseJest } from "../src/output/parse-jest.ts";
import { parsePlaywright } from "../src/output/parse-playwright.ts";

test("parse-jest: passed with retryReasons -> fail attempts then pass", () => {
  const records = parseJest(
    {
      testResults: [
        {
          name: "/repo/a/b.test.ts",
          assertionResults: [
            {
              title: "x",
              fullName: "suite x",
              status: "passed",
              retryReasons: ["Error: boom\n  at f"],
            },
          ],
        },
      ],
    },
    "/repo",
  );
  assert.equal(records.length, 2);
  assert.deepEqual(
    records.map(r => [r.attempt, r.status]),
    [
      [0, "failed"],
      [1, "passed"],
    ],
  );
  assert.equal(records[0].file, "a/b.test.ts");
  assert.equal(records[0].errorMessage, "Error: boom");
});

test("parse-jest: plain failure is one unexpected failed record", () => {
  const records = parseJest(
    {
      testResults: [
        {
          name: "/repo/a.test.ts",
          assertionResults: [
            {
              title: "y",
              fullName: "y",
              status: "failed",
              failureMessages: ["AssertionError: nope\n at z"],
            },
          ],
        },
      ],
    },
    "/repo",
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].status, "failed");
  assert.equal(records[0].unexpected, true);
  assert.equal(records[0].errorMessage, "AssertionError: nope");
});

test("parse-jest: no retries -> no flake records", () => {
  const records = parseJest(
    {
      testResults: [
        {
          name: "/repo/a.test.ts",
          assertionResults: [{ title: "y", fullName: "y", status: "passed" }],
        },
      ],
    },
    "/repo",
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].status, "passed");
});

test("parse-playwright: results[] expand into per-attempt records", () => {
  const records = parsePlaywright(
    {
      suites: [
        {
          title: "file.spec.ts",
          file: "tests/file.spec.ts",
          specs: [
            {
              title: "does thing",
              file: "tests/file.spec.ts",
              tests: [
                {
                  status: "flaky",
                  results: [
                    { status: "failed", retry: 0, error: { message: "timeout", stack: "stack" } },
                    { status: "passed", retry: 1 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    "/repo",
  );
  assert.equal(records.length, 2);
  assert.equal(records[0].status, "failed");
  assert.equal(records[0].attempt, 0);
  assert.equal(records[0].unexpected, true);
  assert.equal(records[1].status, "passed");
  assert.equal(records[1].attempt, 1);
  assert.equal(records[0].title, "file.spec.ts does thing");
});

test("parse-playwright: timedOut counts as failed", () => {
  const records = parsePlaywright(
    {
      suites: [
        {
          specs: [
            {
              title: "t",
              file: "a.spec.ts",
              tests: [{ status: "unexpected", results: [{ status: "timedOut", retry: 0 }] }],
            },
          ],
        },
      ],
    },
    "/repo",
  );
  assert.equal(records[0].status, "failed");
  assert.equal(records[0].unexpected, true);
});

test("parse-playwright: file is repo-relative via config.rootDir (not testDir-relative)", () => {
  // Playwright reports spec.file relative to config.rootDir (the testDir). The
  // parser must join+relativize against repoRoot so filter.file honors the
  // repo-relative contract.
  const repoRoot = "/repo";
  const records = parsePlaywright(
    {
      config: { rootDir: "/repo/apps/ledger-live-desktop/tests" },
      suites: [
        {
          title: "terms.spec.ts",
          file: "specs/general/terms.spec.ts",
          specs: [
            {
              title: "Terms of Use",
              file: "specs/general/terms.spec.ts",
              tests: [{ status: "expected", results: [{ status: "passed", retry: 0 }] }],
            },
          ],
        },
      ],
    },
    repoRoot,
  );
  assert.equal(records.length, 1);
  assert.equal(
    records[0].file,
    "apps/ledger-live-desktop/tests/specs/general/terms.spec.ts",
    "file must be repo-relative (rootDir joined, relativized against repoRoot)",
  );
  assert.equal(records[0].title, "terms.spec.ts Terms of Use");
});

test("parse-playwright: absolute spec.file is relativized against repoRoot", () => {
  const records = parsePlaywright(
    {
      config: { rootDir: "/repo/apps/ledger-live-desktop/tests" },
      suites: [
        {
          specs: [
            {
              title: "t",
              file: "/repo/apps/ledger-live-desktop/tests/specs/x.spec.ts",
              tests: [{ status: "expected", results: [{ status: "passed", retry: 0 }] }],
            },
          ],
        },
      ],
    },
    "/repo",
  );
  assert.equal(records[0].file, "apps/ledger-live-desktop/tests/specs/x.spec.ts");
});
