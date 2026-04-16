import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../..");
const WRAPPER = path.resolve(import.meta.dir, "./wrapper.ts");

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export async function runCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<RunResult> {
  // --cwd (NOT the cwd: subprocess option) makes Bun resolve tsconfig and workspace packages from the wallet-cli root.
  const proc = Bun.spawn(["bun", "--cwd", ROOT, WRAPPER, ...args], {
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
