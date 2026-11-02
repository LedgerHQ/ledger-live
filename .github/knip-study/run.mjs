// Knip study: per-package `unimported` invocations vs. grouped runs from the repo root.
//   node .github/knip-study/run.mjs grouped            -> one knip run per (config kind, tsConfig) group
//   node .github/knip-study/run.mjs fanout [parallel]  -> every per-package invocation, `parallel` at a time
//   node .github/knip-study/run.mjs compare            -> diff the two issue sets, print markdown
// Results land in knip-study-out/.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "knip-study-out";
const KNIP = "node_modules/.bin/knip";
const COMBINED_CONFIG = ".github/knip-study/knip.combined.config.mjs";
mkdirSync(OUT, { recursive: true });

function readInvocations() {
  const files = execFileSync("git", ["ls-files", "*package.json"], { encoding: "utf8" })
    .trim()
    .split("\n");
  const seen = new Set();
  return files.flatMap(file => {
    const scripts = JSON.parse(readFileSync(file, "utf8")).scripts ?? {};
    // What CI runs: `unimported` for packages, and `knip-check` only for the desktop and mobile apps.
    const appKnipCheck = file.startsWith("apps/") ? scripts["knip-check"] : undefined;
    const script = [scripts.unimported, appKnipCheck].filter(Boolean).join("&&");
    return script
      .split("&&")
      .filter(part => part.includes("pnpm knip"))
      .map(part => ({
        workspace: part.match(/-W\s+(\S+)/)[1],
        config: part.match(/-c\s+(\S+)/)?.[1] ?? null,
        tsConfig: part.match(/--tsConfig\s+(\S+)/)?.[1] ?? null,
      }))
      .filter(inv => {
        const key = JSON.stringify(inv);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  });
}

// knip exits non-zero only for issue types whose rule is "error" (unset rules default to "error").
const RULES = JSON.parse(readFileSync("knip.json", "utf8")).rules ?? {};
const isErrorType = type => (RULES[type] ?? "error") === "error";

function runKnip(args, env = {}) {
  return new Promise(resolve => {
    const start = performance.now();
    const child = spawn(KNIP, ["--reporter", "json", "--no-exit-code", "--no-progress", ...args], {
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => (stdout += chunk));
    child.stderr.on("data", chunk => (stderr += chunk));
    child.on("close", code => {
      let issues = null;
      try {
        issues = JSON.parse(stdout).issues;
      } catch {}
      resolve({ args, code, seconds: (performance.now() - start) / 1000, issues, stderr });
    });
  });
}

function flatten(issues, workspaces) {
  const byDepth = [...workspaces].sort((a, b) => b.length - a.length);
  const workspaceOf = file => byDepth.find(ws => file.startsWith(`${ws}/`));
  const keys = new Set();
  const failingWorkspaces = new Set();
  let outOfScope = 0;
  for (const entry of issues ?? []) {
    const workspace = workspaceOf(entry.file);
    for (const [type, items] of Object.entries(entry)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const name = Array.isArray(item) ? item.map(i => i.name).join("|") : item.name;
        if (!workspace) {
          outOfScope++;
          continue;
        }
        keys.add(`${type}\t${entry.file}\t${name}`);
        if (isErrorType(type)) failingWorkspaces.add(workspace);
      }
    }
  }
  return { keys, failingWorkspaces, outOfScope };
}

async function pool(tasks, parallel) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) results.push(await tasks[next++]());
  };
  await Promise.all(Array.from({ length: parallel }, worker));
  return results;
}

function record(mode, runs, totalSeconds) {
  const keys = new Set();
  const failingWorkspaces = new Set();
  let outOfScope = 0;
  for (const run of runs) {
    const flat = flatten(run.issues, run.workspaces);
    flat.keys.forEach(key => keys.add(key));
    flat.failingWorkspaces.forEach(ws => failingWorkspaces.add(ws));
    outOfScope += flat.outOfScope;
  }
  const report = {
    mode,
    totalSeconds,
    runs: runs.map(({ label, workspaces, seconds, code, issues, stderr }) => ({
      label,
      workspaceCount: workspaces.length,
      seconds,
      code,
      parsed: issues !== null,
      stderr: stderr.trim().split("\n").filter(Boolean).slice(0, 20),
    })),
    issueCount: keys.size,
    failingWorkspaces: [...failingWorkspaces].sort(),
    outOfScope,
  };
  writeFileSync(`${OUT}/${mode}.json`, JSON.stringify(report, null, 2));
  writeFileSync(`${OUT}/${mode}-issues.tsv`, [...keys].sort().join("\n") + "\n");
  console.log(JSON.stringify({ ...report, runs: report.runs.map(({ stderr, ...r }) => r) }, null, 2));
}

async function grouped() {
  const groups = new Map();
  for (const inv of readInvocations()) {
    const platform = inv.config?.match(/knip\.(\w+)\.config/)[1] ?? "root";
    const key = `${platform} ${inv.tsConfig ?? "default"}`;
    if (!groups.has(key)) groups.set(key, { platform, tsConfig: inv.tsConfig, items: [] });
    groups.get(key).items.push(inv);
  }
  const start = performance.now();
  const runs = [];
  for (const [label, group] of groups) {
    const workspaces = group.items.map(inv => inv.workspace);
    const args = workspaces.flatMap(ws => ["-W", ws]);
    const env = {};
    if (group.platform !== "root") {
      args.push("-c", COMBINED_CONFIG);
      env.KNIP_STUDY_CONFIGS = group.items.map(inv => inv.config).join(",");
    }
    if (group.tsConfig) args.push("--tsConfig", group.tsConfig);
    console.error(`grouped: ${label} (${workspaces.length} workspaces)`);
    runs.push({ label, workspaces, ...(await runKnip(args, env)) });
  }
  record("grouped", runs, (performance.now() - start) / 1000);
}

async function fanout(parallel) {
  const start = performance.now();
  const tasks = readInvocations().map(inv => async () => {
    const args = ["-W", inv.workspace];
    if (inv.config) args.push("-c", inv.config);
    if (inv.tsConfig) args.push("--tsConfig", inv.tsConfig);
    const label = `${inv.workspace} ${inv.config ? inv.config.match(/knip\.(\w+)\.config/)[1] : "root"}`;
    return { label, workspaces: [inv.workspace], ...(await runKnip(args)) };
  });
  console.error(`fanout: ${tasks.length} invocations, ${parallel} at a time`);
  record("fanout", await pool(tasks, parallel), (performance.now() - start) / 1000);
}

function compare() {
  const load = mode => JSON.parse(readFileSync(`${OUT}/${mode}.json`, "utf8"));
  const issues = mode => new Set(readFileSync(`${OUT}/${mode}-issues.tsv`, "utf8").split("\n").filter(Boolean));
  const [g, f] = [load("grouped"), load("fanout")];
  const [gi, fi] = [issues("grouped"), issues("fanout")];
  const onlyGrouped = [...gi].filter(k => !fi.has(k)).sort();
  const onlyFanout = [...fi].filter(k => !gi.has(k)).sort();
  writeFileSync(`${OUT}/only-grouped.tsv`, onlyGrouped.join("\n") + "\n");
  writeFileSync(`${OUT}/only-fanout.tsv`, onlyFanout.join("\n") + "\n");
  const failed = r => r.runs.filter(run => !run.parsed).length;
  const lines = [
    "## Knip: grouped root runs vs. per-package fan-out",
    "",
    "| Mode | knip runs | Wall time (s) | Sum of run times (s) | Issues | Unparsed runs |",
    "| --- | --- | --- | --- | --- | --- |",
    ...[g, f].map(
      r =>
        `| ${r.mode} | ${r.runs.length} | ${r.totalSeconds.toFixed(1)} | ${r.runs
          .reduce((s, run) => s + run.seconds, 0)
          .toFixed(1)} | ${r.issueCount} | ${failed(r)} |`,
    ),
    "",
    "### Grouped runs",
    "",
    "| Group | Workspaces | Seconds |",
    "| --- | --- | --- |",
    ...g.runs.map(run => `| ${run.label} | ${run.workspaceCount} | ${run.seconds.toFixed(1)} |`),
    "",
    `Issues only in grouped: **${onlyGrouped.length}**. Issues only in fan-out: **${onlyFanout.length}**.`,
    "",
    `Failing workspaces (error-level issues), grouped: ${g.failingWorkspaces.join(", ") || "none"}`,
    "",
    `Failing workspaces (error-level issues), fan-out: ${f.failingWorkspaces.join(", ") || "none"}`,
    "",
    `Same failing workspaces: **${JSON.stringify(g.failingWorkspaces) === JSON.stringify(f.failingWorkspaces) ? "yes" : "no"}**`,
    "",
    ...(onlyGrouped.length ? ["<details><summary>Only in grouped (first 50)</summary>", "", "```", ...onlyGrouped.slice(0, 50), "```", "</details>", ""] : []),
    ...(onlyFanout.length ? ["<details><summary>Only in fan-out (first 50)</summary>", "", "```", ...onlyFanout.slice(0, 50), "```", "</details>", ""] : []),
  ];
  writeFileSync(
    `${OUT}/verdict.json`,
    JSON.stringify({
      groupedSeconds: g.totalSeconds,
      fanoutSeconds: f.totalSeconds,
      groupedRuns: g.runs.length,
      fanoutRuns: f.runs.length,
      unparsedRuns: failed(g) + failed(f),
      onlyGrouped: onlyGrouped.length,
      onlyFanout: onlyFanout.length,
      groupedFailing: g.failingWorkspaces,
      fanoutFailing: f.failingWorkspaces,
    }),
  );
  console.log(lines.join("\n"));
}

// Replays one historical CI failure. REPLAY_EXPECT lists what CI reported failing, as package names
// (nx project names) or workspace directories. Per-package invocations run only for those packages
// and for any package the grouped run flags, so both directions of disagreement are checked.
async function replay(parallel) {
  const dirByName = new Map(
    execFileSync("git", ["ls-files", "*package.json"], { encoding: "utf8" })
      .trim()
      .split("\n")
      .map(file => [JSON.parse(readFileSync(file, "utf8")).name, file.replace(/\/?package\.json$/, "")]),
  );
  const expected = (process.env.REPLAY_EXPECT ?? "")
    .split(",")
    .filter(Boolean)
    .map(entry => dirByName.get(entry) ?? entry);

  await grouped();
  const groupedFailing = JSON.parse(readFileSync(`${OUT}/grouped.json`, "utf8")).failingWorkspaces;
  const targets = new Set([...expected, ...groupedFailing]);

  const start = performance.now();
  const tasks = readInvocations()
    .filter(inv => targets.has(inv.workspace))
    .map(inv => async () => {
      const args = ["-W", inv.workspace];
      if (inv.config) args.push("-c", inv.config);
      if (inv.tsConfig) args.push("--tsConfig", inv.tsConfig);
      return { label: inv.workspace, workspaces: [inv.workspace], ...(await runKnip(args)) };
    });
  console.error(`replay: ${tasks.length} per-package invocations for ${targets.size} target workspaces`);
  record("fanout", await pool(tasks, parallel), (performance.now() - start) / 1000);
  const fanoutFailing = JSON.parse(readFileSync(`${OUT}/fanout.json`, "utf8")).failingWorkspaces;

  const verdict = {
    expected,
    groupedFailing,
    fanoutFailing,
    reproduced: expected.every(ws => fanoutFailing.includes(ws)),
    groupedCatchesExpected: expected.every(ws => groupedFailing.includes(ws)),
    groupedOnly: groupedFailing.filter(ws => !fanoutFailing.includes(ws)),
    fanoutOnly: fanoutFailing.filter(ws => !groupedFailing.includes(ws)),
    groupedOutsideExpected: groupedFailing.filter(ws => !expected.includes(ws)),
  };
  writeFileSync(`${OUT}/replay.json`, JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
}

const [mode, arg] = process.argv.slice(2);
if (mode === "grouped") await grouped();
else if (mode === "fanout") await fanout(Number(arg ?? 3));
else if (mode === "compare") compare();
else if (mode === "replay") await replay(Number(arg ?? 3));
else throw new Error(`unknown mode ${mode}`);
