/* eslint-disable no-console */
// Builds the Xray Test Execution payload from a directory of Allure results and publishes it.
//
// Mobile is sharded across up to 12 CI jobs, so — unlike desktop, where the Playwright reporter
// publishes directly — the results only exist together once every shard's artifact has been
// downloaded. This script is that aggregation step, and it owns the upload too, so the workflow
// needs nothing but `node <this>`.
//
// Runs under plain `node` with NO install and NO build: Node strips the TypeScript types off the
// shared modules imported below, which are dependency-free on purpose. Keep them that way — a
// single `enum`, `namespace`, decorator or parameter property breaks this with
// ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX (their sibling enum/Currency.ts already trips exactly that).
//
// Configured entirely by environment:
//   ALLURE_RESULTS_DIR  directory of *-result.json (required)
//   PLATFORM            ios | android, used in the execution summary (required)
//   TEST_EXECUTION      reuse an existing Test Execution instead of creating one (optional)
//   XRAY_ENABLED        "true" to publish; anything else writes the report and stops
//   XRAY_CLIENT_ID / XRAY_CLIENT_SECRET / XRAY_API_URL
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildXrayReport } from "../../../libs/live-e2e-shared/src/xray/report.ts";
import { isXrayPublishEnabled, XrayClient } from "../../../libs/live-e2e-shared/src/xray/client.ts";

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

const SPEC_DIR = "e2e/mobile/specs/addAccount";
const resultsDir = process.env.ALLURE_RESULTS_DIR;
const platform = (process.env.PLATFORM ?? "").toUpperCase();
const executionKey = (process.env.TEST_EXECUTION ?? "").trim();

if (!resultsDir || !platform) {
  console.error("::error::ALLURE_RESULTS_DIR and PLATFORM are required");
  process.exit(2);
}

function resultFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile() && entry.name.endsWith("-result.json"))
    .map(entry => join(entry.parentPath, entry.name));
}

function firstLines(message, max = 5) {
  if (!message) return undefined;
  const plain = message.replace(/\[[0-9;]*m/g, "").trim();
  return plain ? plain.split("\n").slice(0, max).join("\n") : undefined;
}

// A retry writes a SECOND result file for the same test (the reporter runs with
// `overwrite: false`), and an iteration is identified by its parameters, so the last entry wins.
// readdir order is arbitrary — sorting by `start` is what makes "last" mean "most recent attempt".
const parsed = resultFiles(resultsDir)
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

const outputFile = join(resultsDir, "xray_report.json");
writeFileSync(outputFile, JSON.stringify(report, null, 2));
console.log(`Xray report saved at: ${outputFile} (${report.tests.length} test(s))`);

// Xray REPLACES a Test Run's iterations on import rather than merging them, so an empty or short
// payload silently deletes rows that are already there. Refuse instead of publishing one.
if (report.tests.length === 0) {
  console.error(`::error::[xray] refusing to publish: no test results found in ${resultsDir}`);
  process.exit(2);
}

// One iteration per add-account spec, counted from the spec dir so a new coin updates this gate
// for free. Fewer means a shard died and importing would delete the missing coins.
const expected = readdirSync(SPEC_DIR).filter(name => name.endsWith(".spec.ts")).length;
for (const test of report.tests) {
  const found = test.iterations?.length ?? 0;
  if (found > 0 && found < expected) {
    console.error(
      `::error::[xray] refusing to publish: ${test.testKey} has ${found}/${expected} iterations ` +
        `(a shard probably died) — importing would delete the missing rows`,
    );
    process.exit(2);
  }
}

if (!isXrayPublishEnabled(process.env)) {
  console.log("[xray] publishing disabled (XRAY_ENABLED != true or credentials missing).");
  process.exit(0);
}

const client = new XrayClient({
  clientId: process.env.XRAY_CLIENT_ID,
  clientSecret: process.env.XRAY_CLIENT_SECRET,
  baseUrl: process.env.XRAY_API_URL,
});
const key = await client.importExecution(report);
console.log(`Xray execution: https://ledgerhq.atlassian.net/browse/${key}`);
