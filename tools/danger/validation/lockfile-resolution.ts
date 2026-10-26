import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const RESOLUTION_INPUTS = new Set(["pnpm-lock.yaml", "pnpm-workspace.yaml"]);
const FIX_COMMAND = "pnpm install --lockfile-only --resolution-only";

// pnpm 11 re-resolves the whole lockfile on the next dependency change, so it must already be stable
async function validateLockfileResolution() {
  const files: string[] = [...danger.git.modified_files, ...danger.git.created_files];
  if (!files.some(file => RESOLUTION_INPUTS.has(file))) return;

  // A separate worktree, so the other validations keep reading the committed pnpm-lock.yaml
  const dir = await mkdtemp(path.join(tmpdir(), "lockfile-resolution-"));
  const worktree = path.join(dir, "repo");
  try {
    await run("git", ["worktree", "add", "--detach", worktree, "HEAD"]);
    await run("pnpm", ["install", "--lockfile-only", "--resolution-only", "--ignore-scripts"], {
      cwd: worktree,
      env: { ...process.env, CI: "true" },
      maxBuffer: 64 * 1024 * 1024,
    });
    const { stdout } = await run("git", ["diff", "--shortstat", "--", "pnpm-lock.yaml"], {
      cwd: worktree,
    });
    if (stdout.trim()) {
      fail(
        `pnpm-lock.yaml changes when fully re-resolved (${stdout.trim()}), so the next dependency update would rewrite it. Run \`${FIX_COMMAND}\` and commit the result.`,
      );
    }
  } catch (error) {
    // A registry or tooling failure must not block the PR
    console.warn("Could not re-resolve pnpm-lock.yaml", error);
    warn("Could not check that pnpm-lock.yaml is stable under re-resolution, see the job logs.");
  } finally {
    await run("git", ["worktree", "remove", "--force", worktree]).catch(() => {});
    await rm(dir, { recursive: true, force: true });
  }
}

export default validateLockfileResolution;
