import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../../..");
const WRAPPER = path.resolve(import.meta.dir, "./wrapper.ts");
const WRAPPER_LOCAL = path.resolve(import.meta.dir, "./wrapper-local.ts");

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

async function spawnCli(
  wrapper: string,
  args: string[],
  env: Record<string, string>,
): Promise<RunResult> {
  // --cwd (NOT the cwd: subprocess option) makes Bun resolve tsconfig and workspace packages from the wallet-cli root.
  const proc = Bun.spawn(["bun", "--cwd", ROOT, wrapper, ...args], {
    env: {
      ...process.env,
      NO_COLOR: "1",
      CLAUDECODE: "1", // triggers isInteractive() === false → disables spinner
      ...env,
    },
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

export async function runCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<RunResult> {
  return spawnCli(WRAPPER, args, env);
}

/** Like runCli but without HTTP interception — use for commands that make no network calls. */
export async function runLocalCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<RunResult> {
  return spawnCli(WRAPPER_LOCAL, args, env);
}
