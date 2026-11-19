// Speculos sessions through libs/live-e2e-shared's `e2e-cli speculos`: the E2E suites' firmware,
// app versions and Speculinho session handling, without this package importing the E2E libraries.
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { log, run } from "../measure/exec.ts";

// Speculinho's usage reports count sessions by this origin (libs/live-e2e-shared/SPECULINHO.md).
const SUITE = "mobile-startup-perf";
// /acquire waits up to 90 s for a slot at the instance cap, then up to 150 s for the instance.
const START_TIMEOUT_MS = 360_000;
const STOP_TIMEOUT_MS = 120_000;

export interface SpeculosSession {
  id: string;
  address: string;
  model: string;
  sessionToken?: string;
}

export function parseSession(text: string): SpeculosSession {
  const value = JSON.parse(text) as Partial<Record<keyof SpeculosSession, unknown>>;
  const { id, address, model, sessionToken } = value;
  if (typeof id !== "string" || typeof address !== "string" || typeof model !== "string") {
    throw new Error("speculos: the session file has no id, address or model");
  }
  if (sessionToken !== undefined && typeof sessionToken !== "string") {
    throw new Error("speculos: the session token is not a string");
  }
  return { id, address, model, ...(sessionToken ? { sessionToken } : {}) };
}

const lastLines = (text: string, count: number) => text.trim().split("\n").slice(-count).join("\n");

/** Runs from the repository root; `workDir` holds the app catalog and, briefly, each session. */
export function createSpeculos({ repoRoot, workDir }: { repoRoot: string; workDir: string }) {
  const catalog = path.join(workDir, "nano-app-catalog.json");
  const cli = (args: string[], timeoutMs: number) =>
    run("pnpm", ["--dir", "libs/live-e2e-shared", "e2e-cli", "speculos", ...args], {
      cwd: repoRoot,
      timeoutMs,
    });

  return {
    async start(app: string): Promise<SpeculosSession> {
      const out = path.join(workDir, `speculos-${app}.json`);
      const { stdout } = await cli(
        ["start", "--app", app, "--suite", SUITE, "--catalog", catalog, "--out", out],
        START_TIMEOUT_MS,
      );
      log(`  ${lastLines(stdout, 1)}`);
      try {
        return parseSession(await readFile(out, "utf8"));
      } finally {
        await rm(out, { force: true });
      }
    },
    async stop(id: string): Promise<void> {
      await cli(["stop", "--id", id], STOP_TIMEOUT_MS).then(
        ({ stdout }) => log(`  ${lastLines(stdout, 1)}`),
        (error: unknown) => log(`  could not release Speculos ${id}: ${String(error)}`),
      );
    },
  };
}
