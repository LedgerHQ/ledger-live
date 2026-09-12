// Shared plumbing for the cache action.
//
// Runs as TypeScript with no build step: the runner invokes `node main.ts`
// under node24, which strips types natively. There is nothing compiled to
// commit, and the file that runs is the file that gets reviewed. Keep the
// syntax erasable — no enums, namespaces or parameter properties — because
// type stripping erases annotations rather than compiling them away.
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Subcommand = "install" | "probe" | "exists" | "download" | "upload";

const here = dirname(fileURLToPath(import.meta.url));

export const input = (name: string): string => process.env[`INPUT_${name.toUpperCase()}`] ?? "";

// Inputs are handed to the script through the environment rather than argv so
// credentials never show up in a process listing.
function cacheEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    AWS_ACCESS_KEY_ID: input("accessKey"),
    AWS_SECRET_ACCESS_KEY: input("secretKey"),
    AWS_SESSION_TOKEN: input("sessionToken"),
    AWS_REGION: input("region"),
    CACHE_KEY: input("key"),
    CACHE_BUCKET: input("bucket"),
    CACHE_REGION: input("region"),
    CACHE_ENDPOINT: input("endpoint"),
    CACHE_PATH: input("path"),
    CACHE_DESTINATION: input("destination"),
    CACHE_CONCURRENCY: input("concurrency"),
    CACHE_PART_SIZE: input("part-size"),
  };
}

export function run(subcommand: Subcommand): number {
  const result = spawnSync("bash", [join(here, "cache.sh"), subcommand], {
    env: cacheEnv(),
    stdio: "inherit",
  });
  return result.status ?? 1;
}

function append(file: string | undefined, line: string): void {
  if (file) appendFileSync(file, line);
}

export const setOutput = (name: string, value: string): void =>
  append(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);

export const saveState = (name: string, value: string): void =>
  append(process.env.GITHUB_STATE, `${name}=${value}\n`);
