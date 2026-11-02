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
  return files.flatMap(file => {
    const script = JSON.parse(readFileSync(file, "utf8")).scripts?.unimported ?? "";
    return script
      .split("&&")
      .filter(part => part.includes("pnpm knip"))
      .map(part => ({
        workspace: part.match(/-W\s+(\S+)/)[1],
        config: part.match(/-c\s+(\S+)/)?.[1] ?? null,
        tsConfig: part.match(/--tsConfig\s+(\S+)/)?.[1] ?? null,
      }));
  });
}

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
  const inScope = file => workspaces.some(ws => file.startsWith(`${ws}/`));
  const keys = new Set();
  let outOfScope = 0;
  for (const entry of issues ?? []) {
    for (const [type, items] of Object.entries(entry)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const name = Array.isArray(item) ? item.map(i => i.name).join("|") : item.name;
        if (inScope(entry.file)) keys.add(`${type}\t${entry.file}\t${name}`);
        else outOfScope++;
      }
    }
  }
  return { keys, outOfScope };
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
  let outOfScope = 0;
  for (const run of runs) {
    const flat = flatten(run.issues, run.workspaces);
    flat.keys.forEach(key => keys.add(key));
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
    ...(onlyGrouped.length ? ["<details><summary>Only in grouped (first 50)</summary>", "", "```", ...onlyGrouped.slice(0, 50), "```", "</details>", ""] : []),
    ...(onlyFanout.length ? ["<details><summary>Only in fan-out (first 50)</summary>", "", "```", ...onlyFanout.slice(0, 50), "```", "</details>", ""] : []),
  ];
  console.log(lines.join("\n"));
}

const [mode, arg] = process.argv.slice(2);
if (mode === "grouped") await grouped();
else if (mode === "fanout") await fanout(Number(arg ?? 3));
else if (mode === "compare") compare();
else throw new Error(`unknown mode ${mode}`);
