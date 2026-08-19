#!/usr/bin/env node
/**
 * A stand-in for the `playwright` binary used by the playwright CLI integration
 * test.
 *
 *  - Echoes the args it received to FAKE_PW_ARGS_FILE so the test can assert the
 *    wrapper dropped whole-file-skipped spec positionals, injected the title
 *    `--grep-invert`, and — critically — did NOT pass `--reporter` (which would
 *    replace the project's configured reporters).
 *  - Simulates the config-appended `json` reporter: writes a Playwright
 *    json-shaped result to PLAYWRIGHT_JSON_OUTPUT_NAME (the env the wrapper
 *    sets), chosen by FAKE_PW_SCENARIO.
 *  - Exits with the scenario-implied code.
 */
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);

if (process.env.FAKE_PW_ARGS_FILE) {
  writeFileSync(process.env.FAKE_PW_ARGS_FILE, JSON.stringify(args), "utf8");
}

const repoRoot = process.env.QUARANTINE_REPO_ROOT ?? process.cwd();

// One file-suite (title = filename, as Playwright reports it) with rootDir =
// repoRoot, so spec.file "keep.spec.ts" resolves repo-relative and the parser's
// resolved title is "keep.spec.ts <spec title>".
const suite = (specTitle, tests) => ({
  config: { rootDir: repoRoot },
  suites: [
    {
      title: "keep.spec.ts",
      file: "keep.spec.ts",
      specs: [{ title: specTitle, file: "keep.spec.ts", tests }],
    },
  ],
});

const failed = { status: "failed", retry: 0, error: { message: "boom", stack: "boom\n at x" } };

const scenarios = {
  // one unexpected failure that is ignore-quarantined -> gate should force 0
  ignoreOnly: {
    exit: 1,
    json: suite("flaky ignored test", [{ status: "unexpected", results: [failed] }]),
  },
  // an ignore-quarantined failure AND a co-located unquarantined failure
  mixed: {
    exit: 1,
    json: {
      config: { rootDir: repoRoot },
      suites: [
        {
          title: "keep.spec.ts",
          file: "keep.spec.ts",
          specs: [
            {
              title: "flaky ignored test",
              file: "keep.spec.ts",
              tests: [{ status: "unexpected", results: [failed] }],
            },
            {
              title: "real failure",
              file: "keep.spec.ts",
              tests: [{ status: "unexpected", results: [{ status: "failed", retry: 0 }] }],
            },
          ],
        },
      ],
    },
  },
  // pass-on-retry: a failed attempt followed by a passing one (test flaky)
  flake: {
    exit: 0,
    json: suite("wobbly", [
      {
        status: "flaky",
        results: [
          { status: "failed", retry: 0, error: { message: "transient" } },
          { status: "passed", retry: 1 },
        ],
      },
    ]),
  },
  pass: {
    exit: 0,
    json: suite("ok", [{ status: "expected", results: [{ status: "passed", retry: 0 }] }]),
  },
};

const chosen = scenarios[process.env.FAKE_PW_SCENARIO ?? "pass"] ?? scenarios.pass;

const out = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME;
if (out) writeFileSync(out, JSON.stringify(chosen.json), "utf8");

process.exit(chosen.exit);
