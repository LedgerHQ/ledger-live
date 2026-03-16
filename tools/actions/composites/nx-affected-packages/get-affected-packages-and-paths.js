#!/usr/bin/env node
"use strict";

/**
 * Get affected Nx project names and their filesystem paths.
 * Run locally: node get-affected-packages-and-paths.js
 *   Env: BASE, HEAD (optional refs for affected calculation)
 *   Prints JSON to stdout: {"packages":["..."],"paths":["..."]}
 * When required from actions/github-script, pass { base, head, exec } and use the returned result.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS for standalone script and github-script require()
const { spawnSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS for path.relative()
const path = require("path");

async function runPnpm(args, exec) {
  if (exec && exec.getExecOutput) {
    // @actions/exec#getExecOutput returns { stdout, stderr, exitCode }
    return await exec.getExecOutput("pnpm", args, {
      ignoreReturnCode: true,
      silent: true,
    });
  }
  const r = spawnSync("pnpm", args, {
    encoding: "utf-8",
  });
  return {
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
    exitCode: r.status ?? 1,
  };
}

async function getAffectedPackagesAndPaths(options = {}) {
  const base = options.base ?? process.env.BASE ?? "";
  const head = options.head ?? process.env.HEAD ?? "";
  const exec = options.exec;

  // Build name → relative path map from pnpm workspace (one call instead of Nx per project)
  const nameToPath = new Map();
  const { stdout: lsStdout, exitCode: lsCode } = await runPnpm(
    ["ls", "-r", "--depth=-1", "--json"],
    exec,
  );
  if (lsCode === 0 && lsStdout && lsStdout.trim()) {
    try {
      const list = JSON.parse(lsStdout.trim());
      if (Array.isArray(list)) {
        const cwd = process.cwd();
        for (const item of list) {
          if (item && item.name != null && item.path) {
            const relativeRoot = path.relative(cwd, item.path);
            nameToPath.set(item.name, relativeRoot);
          }
        }
      }
    } catch {
      // Ignore; we fall back to nx show project for each name
    }
  }

  const args = ["nx", "show", "projects", "--affected", "--json"];
  if (base) args.push("--base", base);
  if (head) args.push("--head", head);

  let packageNames = [];
  const {
    stdout: affectedStdout,
    stderr: affectedStderr,
    exitCode,
  } = await runPnpm(args, exec);

  // If Nx cannot compute affected projects, fail instead of silently
  // returning an empty list, which could cause CI to skip tests/jobs.
  if (exitCode !== 0) {
    const debugEnabled =
      process.env.RUNNER_DEBUG === "1" || process.env.DEBUG_NX_AFFECTED;
    if (debugEnabled) {
      console.error(
        "[nx-affected] `pnpm nx show projects --affected --json` failed.",
        "exitCode:",
        exitCode,
        "stderr:",
        affectedStderr || "<none>",
        "stdout:",
        affectedStdout || "<none>",
      );
    }
    throw new Error(
      `pnpm nx show projects --affected --json failed with exit code ${exitCode}`,
    );
  }

  if (!affectedStdout || !affectedStdout.trim()) {
    const debugEnabled =
      process.env.RUNNER_DEBUG === "1" || process.env.DEBUG_NX_AFFECTED;
    if (debugEnabled) {
      console.error(
        "[nx-affected] `pnpm nx show projects --affected --json` produced no output.",
        "stderr:",
        affectedStderr || "<none>",
      );
    }
    throw new Error(
      "pnpm nx show projects --affected --json returned empty output",
    );
  }

  try {
    const parsed = JSON.parse(affectedStdout.trim());
    if (Array.isArray(parsed)) packageNames = parsed.filter(Boolean);
  } catch (e) {
    const debugEnabled =
      process.env.RUNNER_DEBUG === "1" || process.env.DEBUG_NX_AFFECTED;
    if (debugEnabled) {
      console.error(
        "[nx-affected] Failed to parse affected projects JSON.",
        "error:",
        e,
        "stderr:",
        affectedStderr || "<none>",
        "stdout:",
        affectedStdout || "<none>",
      );
    }
    throw new Error("Failed to parse output from pnpm nx show projects");
  }

  const paths = [];
  for (const name of packageNames) {
    const mapped = nameToPath.get(name);
    if (mapped != null) {
      paths.push(mapped);
      continue;
    }
    // Fallback: Nx project not in pnpm workspace
    try {
      const { stdout: projectStdout, exitCode: projectCode } = await runPnpm(
        ["nx", "show", "project", name, "--json"],
        exec,
      );
      if (projectCode === 0 && projectStdout && projectStdout.trim()) {
        const project = JSON.parse(projectStdout.trim());
        if (project && project.root) paths.push(project.root);
      }
    } catch {
      // Ignore per-project lookup errors; skip this project
    }
  }
  const pathsDeduped = [...new Set(paths)];

  return { packages: packageNames, paths: pathsDeduped };
}

module.exports = { getAffectedPackagesAndPaths };

if (require.main === module) {
  getAffectedPackagesAndPaths()
    .then(result => console.log(JSON.stringify(result)))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
