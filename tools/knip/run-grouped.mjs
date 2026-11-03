#!/usr/bin/env node
/**
 * Runs knip once per platform group from the repo root instead of once per package.
 *
 * The per-package invocations stay the source of truth: every `unimported` script, plus the
 * `knip-check` scripts of the apps. They are grouped by platform config and `--tsConfig`, because
 * one knip run resolves one platform (`compilers` is a root-level setting). Each group then runs
 * once with all its workspaces passed as `-W`.
 *
 * Exits non-zero when any group fails. Extra arguments are passed to every knip run.
 */
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const COMBINED_CONFIG = "tools/knip/combined.config.mjs";

function readInvocations() {
  const manifests = execFileSync("git", ["ls-files", "*package.json"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(path => path === "package.json" || path.endsWith("/package.json"));
  const seen = new Set();
  return manifests.flatMap(manifest => {
    const scripts = JSON.parse(readFileSync(manifest, "utf8")).scripts ?? {};
    const appKnipCheck = manifest.startsWith("apps/") ? scripts["knip-check"] : undefined;
    return [scripts.unimported, appKnipCheck]
      .filter(Boolean)
      .join("&&")
      .split("&&")
      .filter(command => command.includes("pnpm knip"))
      .map(command => ({
        workspace: command.match(/-W\s+(\S+)/)[1],
        config: command.match(/-c\s+(\S+)/)?.[1] ?? null,
        tsConfig: command.match(/--tsConfig\s+(\S+)/)?.[1] ?? null,
      }))
      .filter(invocation => {
        const key = JSON.stringify(invocation);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  });
}

function groupInvocations(invocations) {
  const groups = new Map();
  for (const invocation of invocations) {
    const platform = invocation.config?.match(/knip\.(\w+)\.config/)?.[1] ?? "root";
    const label = `${platform} (${invocation.tsConfig ?? "default tsconfig"})`;
    if (!groups.has(label))
      groups.set(label, { platform, tsConfig: invocation.tsConfig, items: [] });
    groups.get(label).items.push(invocation);
  }
  return groups;
}

const extraArgs = process.argv.slice(2);
const failedGroups = [];

for (const [label, group] of groupInvocations(readInvocations())) {
  const args = ["--no-progress", ...group.items.flatMap(({ workspace }) => ["-W", workspace])];
  const env = { ...process.env };
  if (group.platform !== "root") {
    args.push("-c", COMBINED_CONFIG);
    env.KNIP_COMBINED_CONFIGS = group.items.map(({ config }) => config).join(",");
  }
  if (group.tsConfig) args.push("--tsConfig", group.tsConfig);

  console.log(`\n▶ knip ${label}: ${group.items.length} workspaces`);
  const startedAt = performance.now();
  const { status } = spawnSync("pnpm", ["exec", "knip", ...args, ...extraArgs], {
    env,
    stdio: "inherit",
  });
  const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
  console.log(`${status === 0 ? "✔" : "✖"} knip ${label} finished in ${seconds}s`);
  if (status !== 0) failedGroups.push(label);
}

if (failedGroups.length > 0) {
  console.error(`\nknip failed for: ${failedGroups.join(", ")}`);
  process.exit(1);
}
