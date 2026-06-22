// Convert Maestro debug output (per-flow `commands-*.json` + screenshots + maestro.log) into an
// Allure results directory, matching what the Detox suite produces: nested steps (subflows nest via
// runFlow), per-step status/timing, screenshot + view-hierarchy + logs attached on failure.
//
// Input:  $MAESTRO_DEBUG_ROOT/<flow>/{commands-*.json, maestro.log, screenshot-*.png, meta.json}
// Output: $MAESTRO_ALLURE_RESULTS/{<uuid>-result.json, <uuid>-attachment.*, environment.properties,
//         categories.json}
// Run from e2e/mobile:  node maestro/reporting/maestro-to-allure.mjs

import {
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  statSync,
} from "node:fs";
import { join, basename, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";

const CWD = process.cwd();
const DEBUG_ROOT = process.env.MAESTRO_DEBUG_ROOT || "artifacts/maestro-debug";
const RESULTS = process.env.MAESTRO_ALLURE_RESULTS || "artifacts/maestro-allure-results";

const FILTER_TYPES = new Set(["applyConfigurationCommand", "defineVariablesCommand"]);
const CONTAINER_TYPES = new Set(["runFlowCommand", "repeatCommand"]);

const mapStatus = s => (s === "FAILED" ? "failed" : s === "WARNED" ? "skipped" : "passed");

function selectorText(sel) {
  if (!sel || typeof sel !== "object") return "";
  if (sel.idRegex) return `id: ${sel.idRegex}`;
  if (sel.textRegex) return `text: ${sel.textRegex}`;
  if (sel.point) return `point: ${sel.point}`;
  for (const rel of ["below", "above", "leftOf", "rightOf", "containsChild", "containsDescendants"]) {
    if (sel[rel]) return `${rel} ${selectorText(sel[rel])}`;
  }
  return JSON.stringify(sel);
}

function conditionText(cond) {
  if (!cond || typeof cond !== "object") return "";
  if (cond.visible) return `visible ${selectorText(cond.visible)}`;
  if (cond.notVisible) return `not visible ${selectorText(cond.notVisible)}`;
  if (cond.platform) return `platform ${cond.platform}`;
  if (cond.scriptCondition != null) return `script ${String(cond.scriptCondition).slice(0, 60)}`;
  if (cond.trueCondition != null) return `expr ${String(cond.trueCondition).slice(0, 60)}`;
  return JSON.stringify(cond).slice(0, 80);
}

const short = p => (p ? String(p).replace(/^.*\//, "") : "");

function commandName(cmd) {
  const type = Object.keys(cmd)[0];
  const c = cmd[type] || {};
  switch (type) {
    case "runFlowCommand":
      if (c.sourceDescription) return `Run ${short(c.sourceDescription)}`;
      if (c.condition) return `When ${conditionText(c.condition)}`;
      return "Run flow";
    case "repeatCommand":
      return c.condition ? `Repeat while ${conditionText(c.condition)}` : `Repeat ${c.times ?? ""} times`;
    case "launchAppCommand":
      return `Launch app ${c.appId ?? ""}`.trim();
    case "assertConditionCommand":
      return `Assert ${conditionText(c.condition)}`;
    case "tapOnElement":
      return `Tap on ${selectorText(c.selector)}${c.selector?.optional ? " (optional)" : ""}`;
    case "tapOnPointV2Command":
      return `Tap on point ${c.point ?? ""}`.trim();
    case "inputTextCommand":
      return "Input text";
    case "eraseTextCommand":
      return "Erase text";
    case "runScriptCommand":
      return `Run script ${short(c.sourceDescription)}`.trim();
    case "waitForAnimationToEndCommand":
      return "Wait for animation to end";
    case "takeScreenshotCommand":
      return `Take screenshot ${short(c.path)}`.trim();
    case "scrollUntilVisibleCommand":
      return `Scroll until ${selectorText(c.selector || c.visibleElement)}`;
    case "openLinkCommand":
      return `Open link ${c.link ?? ""}`.trim();
    case "swipeCommand":
      return "Swipe";
    case "backPressCommand":
      return "Back press";
    case "hideKeyboardCommand":
      return "Hide keyboard";
    default:
      return type.replace(/Command$/, "");
  }
}

function buildTree(entries) {
  const nodes = entries
    .map(e => {
      const meta = e.metadata || {};
      const cmd = meta.evaluatedCommand || e.command;
      const type = Object.keys(cmd)[0];
      const start = Number(meta.timestamp) || 0;
      const stop = start + (Number(meta.duration) || 0);
      return { cmd, type, meta, start, stop, isContainer: CONTAINER_TYPES.has(type), children: [] };
    })
    .filter(n => !FILTER_TYPES.has(n.type));
  // start asc; at equal start the longer-running (container) sorts first so it wraps its children.
  nodes.sort((a, b) => a.start - b.start || b.stop - a.stop);
  const root = { children: [] };
  const stack = [];
  for (const n of nodes) {
    while (stack.length && stack[stack.length - 1].stop <= n.start) stack.pop();
    (stack.length ? stack[stack.length - 1] : root).children.push(n);
    if (n.isContainer) stack.push(n);
  }
  return root.children;
}

// --- attachments ---------------------------------------------------------------------------------
function attachFile(absPath, name, type) {
  if (!absPath || !existsSync(absPath)) return null;
  const source = `${randomUUID()}-attachment${extname(absPath) || ".bin"}`;
  copyFileSync(absPath, join(RESULTS, source));
  return { name, source, type };
}
function attachText(content, name, ext, type) {
  const source = `${randomUUID()}-attachment.${ext}`;
  writeFileSync(join(RESULTS, source), content);
  return { name, source, type };
}

function toStep(n) {
  const step = {
    name: commandName(n.cmd),
    status: mapStatus(n.meta.status),
    stage: "finished",
    start: n.start,
    stop: n.stop,
    steps: n.children.map(toStep),
    attachments: [],
    parameters: [],
  };
  const err = n.meta.error;
  if (n.meta.status === "FAILED" && err) {
    step.statusDetails = { message: err.message || "", trace: err.debugMessage || err.stackTrace || "" };
  }
  if (n.type === "takeScreenshotCommand") {
    let p = (n.cmd.takeScreenshotCommand || {}).path;
    if (p) {
      if (!p.endsWith(".png")) p += ".png";
      const a = attachFile(resolve(CWD, p), short(p), "image/png");
      if (a) step.attachments.push(a);
    }
  }
  return step;
}

function flatten(entries) {
  return entries.flatMap(e => {
    const meta = e.metadata || {};
    const cmd = meta.evaluatedCommand || e.command;
    return [{ type: Object.keys(cmd)[0], cmd, meta }];
  });
}

function glob(dir, re) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => re.test(f)).map(f => join(dir, f));
}

// Recursive file finder — Maestro may nest screenshots under a timestamp subfolder despite
// --flatten-debug-output, so search the whole flow dir tree.
function findFiles(dir, re) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findFiles(p, re));
    else if (re.test(e.name)) out.push(p);
  }
  return out;
}

function convertFlow(dir) {
  const cmdFiles = findFiles(dir, /^commands-.*\.json$/);
  if (cmdFiles.length === 0) return null;
  const entries = JSON.parse(readFileSync(cmdFiles[0], "utf8"));
  const meta = existsSync(join(dir, "meta.json"))
    ? JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"))
    : {};
  const flow = meta.flow || basename(dir);
  const platform = meta.platform || "unknown";

  const flat = flatten(entries);
  // A wrapper flow that runFlows a subflow has several applyConfigurationCommands (wrapper + subflows);
  // use the one that actually carries tags.
  const tags = (flat.find(
    e => e.type === "applyConfigurationCommand" && e.cmd.applyConfigurationCommand?.config?.tags,
  )?.cmd.applyConfigurationCommand?.config?.tags) || [];
  const failed = flat.find(e => e.meta.status === "FAILED");
  const status = failed ? "failed" : "passed";

  const starts = flat.map(e => Number(e.meta.timestamp) || 0).filter(Boolean);
  const stops = flat.map(e => (Number(e.meta.timestamp) || 0) + (Number(e.meta.duration) || 0));
  const start = starts.length ? Math.min(...starts) : Date.now();
  const stop = stops.length ? Math.max(...stops) : start;

  const steps = buildTree(entries).map(toStep);

  const attachments = [];
  const log = join(dir, "maestro.log");
  const a1 = attachFile(log, "maestro.log", "text/plain");
  if (a1) attachments.push(a1);
  if (meta.harnessLog) {
    const a2 = attachFile(resolve(CWD, meta.harnessLog), `harness (${flow})`, "text/plain");
    if (a2) attachments.push(a2);
  }
  if (failed) {
    // Only the failure screenshot (Maestro marks it with ❌); the ⚠️ ones are intermediate noise.
    for (const png of findFiles(dir, /\.png$/).filter(f => basename(f).includes("❌"))) {
      const a = attachFile(png, "Screenshot at failure", "image/png");
      if (a) attachments.push(a);
    }
    if (failed.meta.error?.hierarchyRoot) {
      attachments.push(
        attachText(
          JSON.stringify(failed.meta.error.hierarchyRoot, null, 2),
          "View hierarchy at failure",
          "json",
          "application/json",
        ),
      );
    }
    // Speculos container logs produced during THIS flow (mtime within the flow window), not stale ones.
    for (const slog of glob(resolve(CWD, "artifacts"), /^speculos-.*\.log$/)) {
      let mtime = 0;
      try {
        mtime = statSync(slog).mtimeMs;
      } catch {}
      if (mtime >= start - 1000) {
        const a = attachFile(slog, basename(slog), "text/plain");
        if (a) attachments.push(a);
      }
    }
  }

  const labels = [
    { name: "suite", value: `Maestro ${platform}` },
    { name: "feature", value: flow },
    { name: "framework", value: "maestro" },
    { name: "language", value: "yaml" },
    { name: "host", value: process.env.RUNNER_NAME || hostname() },
    ...tags.map(t => ({ name: "tag", value: t })),
  ];
  const links = tags
    .filter(t => /^[A-Z]+-\d+$/.test(t))
    .flatMap(t => [
      { type: "issue", url: `https://ledgerhq.atlassian.net/browse/${t}`, name: t },
      { type: "tms", url: `https://ledgerhq.atlassian.net/browse/${t}`, name: t },
    ]);

  const result = {
    uuid: randomUUID(),
    historyId: `${flow}:${platform}`,
    name: flow,
    fullName: `${flow}#${platform}`,
    status,
    stage: "finished",
    start,
    stop,
    labels,
    links,
    steps,
    attachments,
    parameters: [{ name: "platform", value: platform }],
  };
  if (failed) {
    result.statusDetails = {
      message: failed.meta.error?.message || "Flow failed",
      trace: failed.meta.error?.debugMessage || failed.meta.error?.stackTrace || "",
    };
  }
  writeFileSync(join(RESULTS, `${result.uuid}-result.json`), JSON.stringify(result));
  return { flow, platform, status, speculosDevice: meta.speculosDevice, appId: meta.appId };
}

function main() {
  rmSync(RESULTS, { recursive: true, force: true });
  mkdirSync(RESULTS, { recursive: true });

  const flowDirs = existsSync(DEBUG_ROOT)
    ? readdirSync(DEBUG_ROOT, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => join(DEBUG_ROOT, d.name))
    : [];
  const done = [];
  for (const dir of flowDirs) {
    try {
      const r = convertFlow(dir);
      if (r) done.push(r);
    } catch (e) {
      console.error(`WARN: failed to convert ${dir}: ${e.message}`);
    }
  }

  if (done.length) {
    const env = {
      Platform: [...new Set(done.map(d => d.platform))].join(", "),
      SPECULOS_DEVICE: done.find(d => d.speculosDevice)?.speculosDevice || process.env.SPECULOS_DEVICE || "",
      appId: done.find(d => d.appId)?.appId || "",
      "version.node": process.version,
      framework: "maestro",
    };
    writeFileSync(
      join(RESULTS, "environment.properties"),
      Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n",
    );
    writeFileSync(
      join(RESULTS, "categories.json"),
      JSON.stringify([
        { name: "Failed flows", matchedStatuses: ["failed"] },
        { name: "Optional / skipped steps", matchedStatuses: ["skipped"] },
      ]),
    );
  }

  console.log(
    `maestro-to-allure: ${done.length} flow(s) -> ${RESULTS}\n` +
      done.map(d => `  ${d.status === "failed" ? "FAIL" : "PASS"}  ${d.flow} (${d.platform})`).join("\n"),
  );
}

main();
