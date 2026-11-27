#!/usr/bin/env node
// What each platform still makes once restore-cache has restored what it could: the entries of its
// build matrix, and whether it makes the accounts snapshot. The last step of restore-cache, run from
// the repo root. See README.md, "The cache".
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { BuildEntry } from "./resolve-refs.mts";
import { appendSummary, runStep, StepFailure } from "./step.mts";

export const PLATFORMS = [
  { id: "android", name: "Android" },
  { id: "ios", name: "iOS" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

/** What restore-cache published as one platform's artifacts. */
export interface Restored {
  /** Build A, which the build matrix then leaves out. */
  a: boolean;
  /** The accounts snapshot, which build-snapshot-<platform> and snapshot-<platform> then skip. */
  snapshot: boolean;
}

/** The plan's build matrix entries that a platform's build job still makes. */
export function buildsLeft(builds: BuildEntry[], restored: Restored): BuildEntry[] {
  return builds.filter(entry => !(entry.side === "a" && restored.a));
}

/**
 * `<platform>_builds`: the entries its build matrix makes, [] when nothing is left.
 * `<platform>_save_a`: whether save-cache caches the build A it makes, a release tag's (`cacheA`).
 * `<platform>_snapshot`: whether it makes the accounts snapshot, which save-cache then caches.
 */
export function outputsOf(
  builds: BuildEntry[],
  restored: Record<PlatformId, Restored>,
  { cacheA, snapshot }: { cacheA: boolean; snapshot: boolean },
): string {
  return PLATFORMS.map(({ id }) => {
    const left = buildsLeft(builds, restored[id]);
    const saveA = cacheA && left.some(entry => entry.side === "a");
    const makesSnapshot = snapshot && !restored[id].snapshot;
    return `${id}_builds=${JSON.stringify(left)}\n${id}_save_a=${saveA}\n${id}_snapshot=${makesSnapshot}\n`;
  }).join("");
}

export function summaryOf(restored: Record<PlatformId, Restored>, snapshotRelease = ""): string {
  return PLATFORMS.flatMap(({ id, name }) => [
    ...(restored[id].a ? [`- ${name} build A restored from the cache\n`] : []),
    ...(restored[id].snapshot
      ? [`- ${name} accounts snapshot of ${snapshotRelease} restored from the cache\n`]
      : []),
  ]).join("");
}

const isEntry = (entry: unknown): entry is BuildEntry => {
  const { side, ref, regression } = (entry ?? {}) as Partial<BuildEntry>;
  return (
    (side === "a" || side === "b") && typeof ref === "string" && typeof regression === "string"
  );
};

/** The plan's `builds` output. */
export function buildsOf(json: string | undefined): BuildEntry[] {
  const builds: unknown = JSON.parse(json || "null");
  if (!Array.isArray(builds) || !builds.every(isEntry)) {
    throw new StepFailure(`BUILDS must be the plan's build matrix entries, not ${json}`);
  }
  return builds;
}

function main(): void {
  const env = process.env;
  const builds = buildsOf(env.BUILDS);
  const restored: Record<PlatformId, Restored> = {
    android: {
      a: env.RESTORED_A_ANDROID === "true",
      snapshot: env.RESTORED_SNAPSHOT_ANDROID === "true",
    },
    ios: { a: env.RESTORED_A_IOS === "true", snapshot: env.RESTORED_SNAPSHOT_IOS === "true" },
  };
  const outputs = outputsOf(builds, restored, {
    cacheA: env.CACHE_A === "true",
    snapshot: env.SNAPSHOT === "true",
  });
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, outputs);
  else process.stdout.write(outputs);
  appendSummary(summaryOf(restored, env.SNAPSHOT_RELEASE));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("sides", main);
}
