/* eslint-disable no-console */
// Ranks flaky mobile E2E tests from the nightly CI history, so a ticket can name a root cause
// instead of a symptom.
//
//   node scripts/flake-report.mjs [options]
//   node scripts/flake-report.mjs --runs 5 --platform android
//
// Why the Allure results and not the Jest --outputFile JSON: CI runs Detox with `--retries 2`
// (apps/ledger-live-mobile/scripts/e2e-ci.mjs), and the Jest JSON records only the failing
// attempt. Allure writes one *-result.json per attempt and retries of a test share a historyId,
// so a pass after a failure is visible — which is the whole flake signal. Same source of truth as
// tools/actions/composites/get-failed-tests-summary.
//
// A test is FLAKY only when one run holds both a failing and a passing attempt of it. Detox
// retries the whole spec file, so the passing siblings of a failing test also show 3 attempts:
// counting "has retries" as flaky reports every test in the spec. That is the trap this script
// exists to avoid.
import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const exec = promisify(execFile);

const WORKFLOW = "test-mobile-e2e-reusable.yml";
const DEFAULT_REPO = "LedgerHQ/ledger-live";
// Only the per-shard test artifacts carry the Allure results; the rest (allure-report-*,
// *-ai-analysis, usage-metrics-*) are renderings or telemetry and would be dead weight.
const ARTIFACT_RE = /^(android|ios)-test-artifacts-(\d+)$/;
// Frames that are true of nearly every timeout and so identify nothing. Grouping on them would
// merge unrelated flakes into one bucket.
const GENERIC_FRAME_RE =
  /helpers\/(elementHelpers|commonHelpers)|jest\.environment|\/bridge\/|utils\/retry|generateViewHierarchyXml/;
const DOWNLOAD_CONCURRENCY = 4;

const usage = () => {
  console.log(`Ranks flaky mobile E2E tests from the nightly CI history.

  node scripts/flake-report.mjs [options]

Options:
  --runs N          how many recent scheduled nightlies to analyse (default 5)
  --run-id ID       analyse these run ids instead of the latest nightlies (repeatable, or comma-separated)
  --platform P      android | ios | both (default both)
  --repo OWNER/NAME repository to read runs from (default ${DEFAULT_REPO})
  --out DIR         where to write report.json and report.md (default <e2e/mobile>/artifacts/flake-report)
  --cache DIR       where downloaded artifacts are kept between invocations (default $TMPDIR/ll-flake-report)
  --refresh         re-download artifacts even when the cache already holds them
  --json            also print the JSON report to stdout
  -h, --help        this message`);
};

const die = message => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

const parseArgs = argv => {
  const opts = {
    runs: 5,
    runIds: [],
    platform: "both",
    repo: DEFAULT_REPO,
    out: null,
    cache: path.join(os.tmpdir(), "ll-flake-report"),
    refresh: false,
    json: false,
  };
  const needValue = (flag, value) => {
    if (value === undefined || value.startsWith("--")) die(`${flag} requires a value`);
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--runs":
        opts.runs = Number(needValue(arg, argv[++i]));
        if (!Number.isInteger(opts.runs) || opts.runs < 1) die("--runs must be a positive integer");
        break;
      case "--run-id":
        opts.runIds.push(...needValue(arg, argv[++i]).split(",").filter(Boolean));
        break;
      case "--platform":
        opts.platform = needValue(arg, argv[++i]);
        if (!["android", "ios", "both"].includes(opts.platform))
          die("--platform must be android, ios or both");
        break;
      case "--repo":
        opts.repo = needValue(arg, argv[++i]);
        break;
      case "--out":
        opts.out = needValue(arg, argv[++i]);
        break;
      case "--cache":
        opts.cache = needValue(arg, argv[++i]);
        break;
      case "--refresh":
        opts.refresh = true;
        break;
      case "--json":
        opts.json = true;
        break;
      case "-h":
      case "--help":
        usage();
        process.exit(0);
        break;
      default:
        die(`unknown option: ${arg}`);
    }
  }
  return opts;
};

const gh = async args => {
  try {
    // Artifact listings for a dozen shards over several runs exceed the default 1MB buffer.
    const { stdout } = await exec("gh", args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout;
  } catch (error) {
    const detail = (error.stderr || error.message || "").trim().split("\n")[0];
    throw new Error(`gh ${args.slice(0, 3).join(" ")} failed: ${detail}`, { cause: error });
  }
};

const listNightlies = async (repo, limit) => {
  const stdout = await gh([
    "run",
    "list",
    "--repo",
    repo,
    "--workflow",
    WORKFLOW,
    "--event",
    "schedule",
    "--limit",
    String(limit),
    "--json",
    "databaseId,createdAt,conclusion,headSha,url",
  ]);
  return JSON.parse(stdout);
};

const describeRuns = async (repo, runIds) => {
  const runs = [];
  for (const id of runIds) {
    const stdout = await gh([
      "run",
      "view",
      id,
      "--repo",
      repo,
      "--json",
      "databaseId,createdAt,conclusion,headSha,url",
    ]);
    runs.push(JSON.parse(stdout));
  }
  return runs;
};

const listRunArtifacts = async (repo, runId) => {
  const stdout = await gh([
    "api",
    "--paginate",
    `repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
    "--jq",
    ".artifacts[] | {name, expired} | @json",
  ]);
  return stdout
    .split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line));
};

// Downloads every wanted artifact of a run into <cache>/<runId>/<artifactName>/. gh creates one
// subdirectory per artifact when several -n flags are given, which is the layout the parser wants.
const downloadRun = async (repo, runId, names, cacheDir, refresh) => {
  const runDir = path.join(cacheDir, String(runId));
  const missing = refresh ? names : names.filter(name => !fs.existsSync(path.join(runDir, name)));
  if (missing.length === 0) return runDir;
  fs.mkdirSync(runDir, { recursive: true });
  const args = ["run", "download", String(runId), "--repo", repo, "-D", runDir];
  for (const name of missing) args.push("-n", name);
  try {
    await gh(args);
  } catch (error) {
    // One expired or still-uploading artifact must not cost us the other eleven shards.
    console.error(`  warning: bulk download incomplete for run ${runId} (${error.message})`);
    for (const name of missing) {
      if (fs.existsSync(path.join(runDir, name))) continue;
      try {
        await gh([
          "run",
          "download",
          String(runId),
          "--repo",
          repo,
          "-n",
          name,
          "-D",
          path.join(runDir, name),
        ]);
      } catch {
        console.error(`  warning: skipping artifact ${name} of run ${runId}`);
      }
    }
  }
  return runDir;
};

const mapWithConcurrency = async (items, limit, worker) => {
  const results = Array.from({ length: items.length });
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
};

const labelOf = (result, name) =>
  (result.labels || []).find(label => label.name === name)?.value ?? "";

const normalizeMessage = raw => {
  const firstLine = (raw || "")
    .split("\n")
    .map(line => line.trim())
    .find(Boolean);
  return (firstLine || "")
    .replace(/\d+(\.\d+)?\s*sec/gi, "<T>sec")
    .replace(/0x[0-9a-fA-F]{6,}/g, "<ADDR>")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<UUID>")
    .replace(/\b\d{3,}\b/g, "<N>")
    .replace(/\s+/g, " ")
    .slice(0, 240);
};

const classifyKind = raw => {
  const message = raw || "";
  // Ordered most specific first: several of these messages also mention a visibility matcher.
  if (/Web element .* not found after|\[retryUntilTimeout\]/.test(message))
    return "web-element-timeout";
  if (/not found on device screen|Speculos|APDU|device is not connected/i.test(message))
    return "device";
  if (/Action will not be performed because the target view does not match/.test(message))
    return "action-constraint";
  if (/DetoxRuntimeError: The pending request/.test(message)) return "detox-request-rejected";
  if (/effective visibility/.test(message)) return "visibility-timeout";
  if (/timeout expired without matching/.test(message)) return "matcher-timeout";
  if (/No views in hierarchy found matching/.test(message)) return "element-not-found";
  if (/Exceeded timeout of|Async callback was not invoked/.test(message)) return "jest-timeout";
  if (/app (has )?crashed|Lost connection to the app|has crashed/i.test(message))
    return "app-crash";
  if (/ECONNREFUSED|ETIMEDOUT|socket hang up|ENOTFOUND|50[0-9] |Bad Gateway/i.test(message))
    return "network";
  if (/expect\(|toBe|toEqual|toContain|toHaveText/.test(message)) return "assertion";
  return "other";
};

// Frames arrive with the runner's absolute checkout path. Shorten from the first workspace
// directory so the same flake groups whether it was seen in CI or locally.
const toRepoRelative = file => {
  const withoutCheckout = file.replace(/^.*?\/ledger-live\/ledger-live\//, "");
  const fromWorkspace = withoutCheckout.match(
    /(?:^|\/)((?:e2e|libs|apps|features|domain|shared)\/.*)$/,
  );
  const rel = fromWorkspace ? fromWorkspace[1] : withoutCheckout;
  return rel.replace(/^e2e\/mobile\//, "");
};

// The failing call site is far more diagnostic than the message: two specs timing out inside
// ModularDrawer.selectFirstAccount are one bug, not two.
const pickFrames = trace => {
  const frames = (trace || "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("at "))
    .map(line => {
      const match = line.match(/^at\s+(.+?)\s+\((.+?):(\d+):\d+\)$/);
      if (!match) return null;
      const [, fn, file, lineNo] = match;
      return { fn, file, lineNo };
    })
    .filter(Boolean)
    .filter(frame => !frame.file.includes("node_modules") && !frame.file.startsWith("node:"))
    .map(frame => ({
      ...frame,
      // Repo-relative and machine-independent: the CI checkout path differs from a local one,
      // and a frame can sit outside e2e/ (libs/live-e2e-shared), which must still shorten.
      rel: toRepoRelative(frame.file),
    }));
  const specFrame = frames.find(frame => frame.rel.startsWith("specs/"));
  // Falling back to frames[0] when everything is a wrapper would key the group on the reporting
  // helper and merge unrelated flakes; the spec's own line is the better identity.
  const meaningful =
    frames.find(frame => !GENERIC_FRAME_RE.test(frame.rel)) ?? specFrame ?? frames[0];
  return {
    frame: meaningful ? `${meaningful.rel} ${meaningful.fn}` : "",
    frameLine: meaningful ? `${meaningful.rel}:${meaningful.lineNo}` : "",
    specFrame: specFrame ? `${specFrame.rel}:${specFrame.lineNo}` : "",
  };
};

const signatureOf = attempt => {
  const message = attempt.statusDetails?.message ?? "";
  const kind = classifyKind(message);
  const { frame, frameLine, specFrame } = pickFrames(attempt.statusDetails?.trace ?? "");
  const normalized = normalizeMessage(message);
  return {
    kind,
    frame,
    frameLine,
    specFrame,
    message: normalized,
    key: `${kind}|${frame}|${normalized.slice(0, 80)}`,
  };
};

// One shard's Allure directory -> the verdict for every test that ran in it.
const readShard = (shardDir, platform, shard) => {
  const files = fs
    .readdirSync(shardDir)
    .filter(name => name.endsWith("-result.json"))
    .map(name => path.join(shardDir, name));
  const nonEmpty = file => {
    try {
      return fs.statSync(file).size > 0;
    } catch {
      return false;
    }
  };
  const infra =
    nonEmpty(path.join(shardDir, "emulator-deaths.log")) ||
    nonEmpty(path.join(shardDir, "emulator-wedges.log"));

  const byHistory = new Map();
  for (const file of files) {
    let result;
    try {
      result = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue; // A truncated result file is a lost attempt, not a reason to abandon the shard.
    }
    const key = result.historyId || result.fullName || result.name;
    if (!key) continue;
    if (!byHistory.has(key)) byHistory.set(key, []);
    byHistory.get(key).push(result);
  }

  const tests = [];
  for (const attempts of byHistory.values()) {
    // Chronological, so a "failed then passed" reads in the order it happened.
    const ordered = attempts.toSorted((a, b) => (a.start ?? 0) - (b.start ?? 0));
    const statuses = ordered.map(attempt => attempt.status);
    const failed = statuses.filter(status => status === "failed" || status === "broken");
    const passed = statuses.filter(status => status === "passed");
    let verdict;
    if (failed.length > 0 && passed.length > 0) verdict = "flaky";
    else if (failed.length > 0) verdict = "broken";
    else if (passed.length > 0) verdict = attempts.length > 1 ? "retried-sibling" : "stable";
    else verdict = "skipped";

    const spec = labelOf(ordered[0], "sourceFile");
    tests.push({
      key: `${spec}::${ordered[0].name}`,
      name: ordered[0].name,
      spec,
      suite: labelOf(ordered[0], "parentSuite"),
      tags: (ordered[0].labels || [])
        .filter(label => label.name === "tag")
        .map(label => label.value),
      platform,
      shard,
      verdict,
      statuses,
      firstAttemptFailed: statuses[0] === "failed" || statuses[0] === "broken",
      shardInfra: infra,
      signatures: ordered
        .filter(attempt => attempt.status === "failed" || attempt.status === "broken")
        .map(signatureOf),
    });
  }
  return tests;
};

const readRun = (runDir, wantedPlatforms) => {
  if (!fs.existsSync(runDir)) return [];
  const tests = [];
  for (const entry of fs.readdirSync(runDir)) {
    const match = entry.match(ARTIFACT_RE);
    if (!match) continue;
    const [, platform, shard] = match;
    if (!wantedPlatforms.includes(platform)) continue;
    const shardDir = path.join(runDir, entry);
    if (!fs.statSync(shardDir).isDirectory()) continue;
    tests.push(...readShard(shardDir, platform, Number(shard)));
  }
  return tests;
};

const aggregate = runs => {
  const tests = new Map();
  const groups = new Map();
  const latestRun = runs.reduce((a, b) => (a && a.date >= b.date ? a : b), null);

  for (const run of runs) {
    for (const observation of run.tests) {
      if (!tests.has(observation.key)) {
        tests.set(observation.key, {
          key: observation.key,
          name: observation.name,
          spec: observation.spec,
          suite: observation.suite,
          tags: observation.tags,
          platforms: new Set(),
          ran: 0,
          flaky: 0,
          broken: 0,
          observations: [],
        });
      }
      const test = tests.get(observation.key);
      test.platforms.add(observation.platform);
      if (observation.verdict !== "skipped") test.ran += 1;
      if (observation.verdict === "flaky") test.flaky += 1;
      if (observation.verdict === "broken") test.broken += 1;
      test.observations.push({
        runId: run.runId,
        date: run.date,
        url: run.url,
        platform: observation.platform,
        shard: observation.shard,
        verdict: observation.verdict,
        statuses: observation.statuses,
        shardInfra: observation.shardInfra,
      });

      // Only a flake earns a signature group: a permanently broken test is a different ticket, and
      // grouping the two together would bury the flake under the breakage.
      if (observation.verdict !== "flaky") continue;
      for (const signature of observation.signatures) {
        if (!groups.has(signature.key)) {
          groups.set(signature.key, {
            key: signature.key,
            kind: signature.kind,
            frame: signature.frame,
            sampleMessage: signature.message,
            frameLines: new Set(),
            specFrames: new Set(),
            files: new Set(),
            tests: new Set(),
            specs: new Set(),
            platforms: new Set(),
            runs: new Set(),
            nights: new Set(),
            occurrences: 0,
            firstTryFailures: 0,
            laterAttemptOnly: 0,
            neverHealed: 0,
          });
        }
        const group = groups.get(signature.key);
        if (signature.frameLine) group.frameLines.add(signature.frameLine);
        if (signature.specFrame) group.specFrames.add(signature.specFrame);
        for (const frameLine of [signature.frameLine, signature.specFrame]) {
          if (frameLine) group.files.add(frameLine.split(":")[0]);
        }
        group.tests.add(observation.key);
        group.specs.add(observation.spec);
        group.platforms.add(observation.platform);
        group.runs.add(run.runId);
        group.nights.add(run.date);
        if (observation.firstAttemptFailed) group.firstTryFailures += 1;
        else group.laterAttemptOnly += 1;
        if (observation.statuses.at(-1) !== "passed") group.neverHealed += 1;
        group.occurrences += 1;
      }
    }
  }

  const testList = [...tests.values()]
    .map(test => ({
      ...test,
      platforms: [...test.platforms].toSorted(),
      flakeRate: test.ran > 0 ? test.flaky / test.ran : 0,
    }))
    .toSorted((a, b) => b.flaky - a.flaky || b.flakeRate - a.flakeRate);

  const groupList = [...groups.values()]
    .map(group => ({
      ...group,
      inLatestRun: latestRun ? group.runs.has(latestRun.runId) : false,
      lastSeen: [...group.nights].toSorted().at(-1) ?? "",
      nights: [...group.nights].toSorted(),
      files: [...group.files].toSorted(),
      frameLines: [...group.frameLines].toSorted(),
      specFrames: [...group.specFrames].toSorted(),
      tests: [...group.tests].toSorted(),
      specs: [...group.specs].toSorted(),
      platforms: [...group.platforms].toSorted(),
      runs: [...group.runs].toSorted(),
      runCount: group.runs.size,
    }))
    // Latest nightly first, then breadth: a signature that still fires on today's develop is a
    // better ticket than one with a higher historical rate that has not been seen since.
    .toSorted(
      (a, b) =>
        Number(b.inLatestRun) - Number(a.inLatestRun) ||
        b.runCount - a.runCount ||
        b.specs.length - a.specs.length ||
        b.occurrences - a.occurrences,
    );

  return { tests: testList, groups: groupList, latestRun };
};

const pct = value => `${Math.round(value * 100)}%`;

const renderMarkdown = report => {
  const lines = [];
  const flaky = report.tests.filter(test => test.flaky > 0);
  const broken = report.tests.filter(test => test.flaky === 0 && test.broken > 0);
  const infraRuns = report.runs.filter(run => run.tests.some(test => test.shardInfra));

  lines.push("# Mobile E2E flake report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Nightlies analysed: ${report.runs.length} (${report.platforms.join(", ")})`);
  lines.push("");
  lines.push("| run | date | conclusion | tests seen | flaky | broken |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const run of report.runs) {
    const seen = run.tests.length;
    const f = run.tests.filter(test => test.verdict === "flaky").length;
    const b = run.tests.filter(test => test.verdict === "broken").length;
    lines.push(
      `| [${run.runId}](${run.url}) | ${run.date} | ${run.conclusion || "?"} | ${seen} | ${f} | ${b} |`,
    );
  }
  lines.push("");
  lines.push(
    `**${flaky.length} flaky test(s)** in **${report.groups.length} failure signature(s)**; ` +
      `${broken.length} consistently-failing test(s) (not flaky — separate concern).`,
  );
  if (infraRuns.length > 0) {
    lines.push("");
    lines.push(
      `> ${infraRuns.length} run(s) had an emulator wedge or death in at least one shard; ` +
        "failures in those shards may be infra, not the test.",
    );
  }

  const live = report.groups.filter(group => group.inLatestRun);
  const notLatest = report.groups.filter(group => !group.inLatestRun);
  lines.push("");
  lines.push(
    `**${live.length} signature(s) still firing in the latest nightly** ` +
      `(${report.latestRun?.date ?? "?"}); ${notLatest.length} not seen in it.`,
  );
  lines.push("");
  lines.push(
    "> A signature missing from the latest nightly is NOT proof it was fixed - a flake passes on " +
      "some nights by definition. Only a merged change to the implicated files is evidence of a " +
      "fix. Each such entry below carries the `git log` command to check.",
  );

  lines.push("");
  lines.push("## Flaky signatures, ranked");
  if (report.groups.length === 0) lines.push("");
  if (report.groups.length === 0) lines.push("_No flake healed by a retry in the analysed runs._");
  report.groups.forEach((group, index) => {
    lines.push("");
    const status = group.inLatestRun
      ? "🔴 STILL FAILING in the latest nightly"
      : `⚪ not in the latest nightly — last seen ${group.lastSeen}`;
    lines.push(`### ${index + 1}. ${group.kind} — ${group.frame || "unknown call site"}`);
    lines.push("");
    lines.push(`- **Status:** ${status}`);
    lines.push(
      `- **Nightlies affected:** ${group.runCount}/${report.runs.length} (${group.nights.join(", ")})`,
    );
    const shape = [
      `${group.firstTryFailures} failed on the first attempt`,
      group.laterAttemptOnly > 0
        ? `${group.laterAttemptOnly} failed only on a later attempt (passed first try)`
        : null,
      group.neverHealed > 0 ? `${group.neverHealed} never passed on the final attempt` : null,
    ]
      .filter(Boolean)
      .join("; ");
    lines.push(`- **Retry shape:** ${shape}`);
    lines.push(`- **Platforms:** ${group.platforms.join(", ")}`);
    lines.push(`- **Specs:** ${group.specs.join(", ")}`);
    lines.push(`- **Occurrences:** ${group.occurrences}`);
    lines.push(`- **Message:** \`${group.sampleMessage}\``);
    if (group.frameLines.length > 0) lines.push(`- **Seen at:** ${group.frameLines.join(", ")}`);
    if (group.specFrames.length > 0)
      lines.push(`- **Spec call sites:** ${group.specFrames.join(", ")}`);
    lines.push("- **Tests:**");
    for (const testKey of group.tests) {
      const test = report.tests.find(candidate => candidate.key === testKey);
      lines.push(
        `  - ${testKey} — flaked ${test.flaky}/${test.ran} runs (${pct(test.flakeRate)}), ${test.platforms.join("+")}`,
      );
    }
    const specFilter = [...new Set(group.specs.map(spec => spec.replace(/\.spec\.ts$/, "")))].join(
      "|",
    );
    lines.push(`- **Reproduce locally:** \`scripts/flake-check.sh '${specFilter}' --runs 5\``);
    if (!group.inLatestRun && group.files.length > 0) {
      // Absent from the latest nightly: a fix merged since it was last seen would make this entry
      // stale, and ticketing it would re-report work someone has already done.
      const paths = group.files.map(file => `e2e/mobile/${file}`).join(" ");
      lines.push(
        `- **Fixed since?** \`git log origin/develop --merges --since=${group.lastSeen} -- ${paths}\``,
      );
    }
  });

  lines.push("");
  lines.push("## Flaky tests, by flake rate");
  lines.push("");
  lines.push("| test | spec | platforms | flaked | rate | statuses seen |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const test of flaky) {
    const statuses = test.observations
      .filter(observation => observation.verdict === "flaky")
      .map(observation => `${observation.platform}:${observation.statuses.join(">")}`)
      .join("; ");
    lines.push(
      `| ${test.name} | ${test.spec} | ${test.platforms.join("+")} | ${test.flaky}/${test.ran} | ${pct(test.flakeRate)} | ${statuses} |`,
    );
  }

  lines.push("");
  lines.push("## Consistently failing (not flaky)");
  lines.push("");
  if (broken.length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| test | spec | platforms | failed runs |");
    lines.push("| --- | --- | --- | --- |");
    for (const test of broken) {
      lines.push(
        `| ${test.name} | ${test.spec} | ${test.platforms.join("+")} | ${test.broken}/${test.ran} |`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
};

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));
  const e2eDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const outDir = opts.out ?? path.join(e2eDir, "artifacts", "flake-report");
  const platforms = opts.platform === "both" ? ["android", "ios"] : [opts.platform];

  const runs =
    opts.runIds.length > 0
      ? await describeRuns(opts.repo, opts.runIds)
      : await listNightlies(opts.repo, opts.runs);
  if (runs.length === 0) die("no runs found");
  console.error(`==> ${runs.length} run(s) to analyse from ${opts.repo}`);

  const analysed = [];
  await mapWithConcurrency(runs, DOWNLOAD_CONCURRENCY, async run => {
    const artifacts = await listRunArtifacts(opts.repo, run.databaseId);
    const wanted = artifacts
      .filter(artifact => {
        const match = artifact.name.match(ARTIFACT_RE);
        return match && platforms.includes(match[1]) && !artifact.expired;
      })
      .map(artifact => artifact.name);
    if (wanted.length === 0) {
      console.error(`  run ${run.databaseId}: no usable test artifacts (expired?)`);
      return;
    }
    const runDir = await downloadRun(opts.repo, run.databaseId, wanted, opts.cache, opts.refresh);
    const tests = readRun(runDir, platforms);
    console.error(
      `  run ${run.databaseId} (${run.createdAt.slice(0, 10)}): ${wanted.length} shard(s), ${tests.length} test(s)`,
    );
    analysed.push({
      runId: run.databaseId,
      date: run.createdAt.slice(0, 10),
      conclusion: run.conclusion,
      sha: run.headSha,
      url: run.url,
      tests,
    });
  });

  const ordered = analysed.toSorted((a, b) => (a.date < b.date ? 1 : -1));
  const { tests, groups, latestRun } = aggregate(ordered);
  const report = {
    generatedAt: new Date().toISOString(),
    workflow: WORKFLOW,
    repo: opts.repo,
    platforms,
    runs: ordered,
    latestRun: latestRun
      ? { runId: latestRun.runId, date: latestRun.date, url: latestRun.url }
      : null,
    tests,
    groups,
  };

  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "report.json");
  const mdPath = path.join(outDir, "report.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdown(report));
  console.error("");
  console.error(
    `==> ${tests.filter(test => test.flaky > 0).length} flaky test(s) in ${groups.length} signature(s)`,
  );
  console.error(`    ${mdPath}`);
  console.error(`    ${jsonPath}`);
  if (opts.json) console.log(JSON.stringify(report, null, 2));
};

main().catch(error => die(error.message));
