/* eslint-disable no-console */
// Builds the body of Xray's `POST /api/v2/import/execution` from a directory of Allure results.
//
// Runs under plain `node` with NO install and NO build: Node strips the TypeScript types off the
// shared builder imported below, which is dependency-free on purpose. Keep it that way — a single
// `enum`, `namespace`, decorator or parameter property in report.ts breaks this job with
// ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX (its sibling enum/Currency.ts already trips exactly that).
//
// Usage:
//   node build-xray-report.mjs --input <dir> --output <file> --platform <ios|android>
//                              [--execution-key <KEY>] [--expect <KEY>=<n>]
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildXrayReport } from "../../../libs/live-e2e-shared/src/xray/report.ts";

// Allure statuses are not Xray statuses. jest.config.js already maps broken -> failed, but
// `skipped` and `unknown` still reach us and Xray rejects them verbatim — inside `iterations[]`
// one bad status can reject the whole import.
const XRAY_STATUS = {
  passed: "PASSED",
  failed: "FAILED",
  broken: "FAILED",
  skipped: "TODO",
  unknown: "TODO",
};

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
}

function resultFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile() && entry.name.endsWith("-result.json"))
    .map(entry => join(entry.parentPath, entry.name));
}

function firstLines(message, max = 5) {
  if (!message) return undefined;
  const plain = message.replace(/\[[0-9;]*m/g, "").trim();
  return plain ? plain.split("\n").slice(0, max).join("\n") : undefined;
}

const inputDir = arg("input");
const outputFile = arg("output");
const platform = arg("platform").toUpperCase();
const executionKey = arg("execution-key").trim();
const expectations = arg("expect")
  .split(",")
  .filter(Boolean)
  .map(pair => {
    const [testKey, count] = pair.split("=");
    return { testKey, count: Number(count) };
  });

// A retry writes a SECOND result file for the same test (the reporter runs with
// `overwrite: false`), and an iteration is identified by its parameters, so the last entry wins.
// readdir order is arbitrary — sorting by `start` is what makes "last" mean "most recent
// attempt", which is the semantics the bash formatter had via its last-start-wins loop.
const parsed = resultFiles(inputDir)
  .map(file => JSON.parse(readFileSync(file, "utf8")))
  .toSorted((a, b) => (a.start ?? 0) - (b.start ?? 0));

const results = [];
for (const result of parsed) {
  const status = XRAY_STATUS[String(result.status ?? "").toLowerCase()];
  if (!status) {
    console.error(`[xray] ignoring unmappable allure status: ${result.status}`);
    continue;
  }

  // $TmsLink sets `type: "tms"`; $Issue and $Link do not, and their names are not Jira keys.
  const testKeys = (result.links ?? [])
    .filter(link => link.type === "tms")
    .flatMap(link => String(link.name ?? "").split(","))
    .map(key => key.trim())
    .filter(Boolean);
  const parameters = (result.parameters ?? []).filter(p => p.name && p.value);
  const comment = status === "FAILED" ? firstLines(result.statusDetails?.message) : undefined;

  // Parameters are test-scoped, not link-scoped: a test carrying parameters AND several TMS keys
  // would turn every one of them into a data-driven test. Report those flat rather than guess.
  const asIteration = parameters.length > 0 && testKeys.length === 1;
  if (parameters.length > 0 && testKeys.length !== 1) {
    console.error(
      `::warning::[xray] ${result.fullName}: parameters with ${testKeys.length} TMS links, reporting flat`,
    );
  }

  for (const testKey of testKeys) {
    results.push(
      asIteration ? { testKey, status, parameters, comment } : { testKey, status, comment },
    );
  }
}

const report = buildXrayReport(
  results,
  executionKey
    ? { testExecutionKey: executionKey }
    : {
        info: {
          summary: `[${platform}] Speculos test execution`,
          description:
            "This execution is automatically created when importing execution results from an external source",
        },
      },
);

// Xray REPLACES a Test Run's iterations on re-import rather than merging them, so an empty or
// short payload silently deletes rows that are already there. Fail the step instead.
if (report.tests.length === 0) {
  console.error(`::error::[xray] refusing to publish: no test results found in ${inputDir}`);
  process.exit(2);
}
for (const { testKey, count } of expectations) {
  const found = report.tests.find(test => test.testKey === testKey)?.iterations?.length ?? 0;
  if (found < count) {
    console.error(
      `::error::[xray] refusing to publish: ${testKey} has ${found}/${count} iterations ` +
        `(a shard probably died) — importing would delete the missing rows`,
    );
    process.exit(2);
  }
}

writeFileSync(outputFile, JSON.stringify(report, null, 2));
console.log(`Xray JSON file created: ${outputFile} (${report.tests.length} test(s))`);
