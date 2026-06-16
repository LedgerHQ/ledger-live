#!/usr/bin/env node
/* eslint-disable no-console */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const defaultDependency = "react";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lockfilePath = path.join(repoRoot, "pnpm-lock.yaml");
const originalLockfile = fs.readFileSync(lockfilePath, "utf8");
const dependency = await getDependencyName();

["SIGINT", "SIGTERM"].forEach(signal =>
  process.once(signal, () => {
    console.log(`\nRestored pnpm-lock.yaml after ${signal}`);
    restoreAndExit(signal === "SIGINT" ? 130 : 143);
  }),
);

try {
  console.log(`Temporarily changing ${dependency} versions in pnpm-lock.yaml`);
  editLockfile(bumpDep(originalLockfile, dependency));

  console.log("\nRunning: pnpm nx show projects --affected --base=HEAD\n");
  runNxAffected()
    .on("close", exitCode => {
      console.log("\nRestored pnpm-lock.yaml");
      restoreAndExit(exitCode ?? 1);
    })
    .on("error", error => {
      console.error(`Failed to start pnpm: ${error.message}`);
      restoreAndExit(1);
    });
} catch (error) {
  console.error(error.message);
  restoreAndExit(1);
}

async function getDependencyName() {
  const argDependency = process.argv[2]?.trim();
  if (argDependency) return argDependency;

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await readline.question(`Dependency to check (${defaultDependency}): `);
    return answer.trim() || defaultDependency;
  } finally {
    readline.close();
  }
}

function bumpDep(value, dependencyName) {
  const escapedDep = escapeRegExp(dependencyName);
  const depName = `(?:'${escapedDep}'|"${escapedDep}"|${escapedDep})`;
  const oneLineRegExp = new RegExp(`^( {2}${depName}: +\\D*\\d+\\.\\d+\\.)(\\d+)$`, "gm");
  const blockRegExp = new RegExp(
    `^(\\s+${depName}:\\n\\s+specifier: .*\\n\\s+version: +\\D*\\d+\\.\\d+\\.)(\\d+)$`,
    "gm",
  );
  const bumpPatch = (_, prefix, patch) => `${prefix}${Number(patch) + 1}`;

  const bumped = value.replaceAll(oneLineRegExp, bumpPatch).replaceAll(blockRegExp, bumpPatch);

  if (bumped === value) {
    throw new Error(`Could not find a bumpable ${dependencyName} entry in pnpm-lock.yaml`);
  }

  return bumped;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function editLockfile(value) {
  fs.writeFileSync(lockfilePath, value);
}

function restoreAndExit(code) {
  fs.writeFileSync(lockfilePath, originalLockfile);
  process.exit(code);
}

function runNxAffected() {
  return spawn("pnpm", ["nx", "show", "projects", "--affected", "--base=HEAD"], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
}
