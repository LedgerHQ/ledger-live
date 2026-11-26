#!/usr/bin/env node
// What each platform's build matrix still builds once restore-cache has restored what it could:
// the last step of restore-cache, run from the repo root. See README.md, "The cache".
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
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
}

/** The plan's sides that a platform's build job still makes. */
export function sidesLeft(sides: string[], restored: Restored): string[] {
  return sides.filter(side => !(side === "a" && restored.a));
}

/**
 * `<platform>`: the sides its build matrix makes, [] when nothing is left. `<platform>_save_a`:
 * whether save-cache caches the build A it makes, a release tag's (`cacheA`) the cache lacked.
 */
export function outputsOf(
  sides: string[],
  restored: Record<PlatformId, Restored>,
  cacheA: boolean,
): string {
  return PLATFORMS.map(({ id }) => {
    const left = sidesLeft(sides, restored[id]);
    const saveA = cacheA && left.includes("a");
    return `${id}=${JSON.stringify(left)}\n${id}_save_a=${saveA}\n`;
  }).join("");
}

export function summaryOf(restored: Record<PlatformId, Restored>): string {
  return PLATFORMS.filter(({ id }) => restored[id].a)
    .map(({ name }) => `- ${name} build A restored from the cache\n`)
    .join("");
}

export function sidesOf(json: string | undefined): string[] {
  const sides: unknown = JSON.parse(json || "null");
  if (!Array.isArray(sides) || !sides.every(side => typeof side === "string")) {
    throw new StepFailure(`SIDES must be a JSON array of sides, not ${json}`);
  }
  return sides;
}

function main(): void {
  const env = process.env;
  const sides = sidesOf(env.SIDES);
  const restored: Record<PlatformId, Restored> = {
    android: { a: env.RESTORED_A_ANDROID === "true" },
    ios: { a: env.RESTORED_A_IOS === "true" },
  };
  const outputs = outputsOf(sides, restored, env.CACHE_A === "true");
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, outputs);
  else process.stdout.write(outputs);
  appendSummary(summaryOf(restored));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("sides", main);
}
