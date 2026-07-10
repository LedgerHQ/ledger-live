import { chmodSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Write `data` to `dest` at 0600 without ever exposing it at looser permissions: write a fresh 0600
 * temp file alongside `dest`, then rename it over the target. Writing `dest` directly can't do this
 * — `writeFileSync`'s `mode` only applies on create, so an existing file keeps its old permissions.
 *
 * The rename is atomic on POSIX (readers see the whole old or whole new file; a mid-write crash
 * leaves `dest` intact) but is not fsync-durable, and the Windows overwrite fallback below is
 * best-effort and non-atomic. It also replaces a symlink at `dest` instead of writing through it.
 */
export function writeSecureFile(dest: string, data: Buffer | Uint8Array): void {
  const dir = dirname(dest);
  mkdirSync(dir, { recursive: true }); // writeFileSync won't create missing parents (Bun.write did)
  const tmp = join(dir, `.${basename(dest)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
  try {
    writeFileSync(tmp, data, { mode: 0o600 });
    // Best-effort re-assert for filesystems that ignore writeFileSync's creation mode.
    try {
      chmodSync(tmp, 0o600);
    } catch {}
    try {
      renameSync(tmp, dest);
    } catch (renameError) {
      // Windows can't rename over an existing file: delete + retry. Scoped to the rename alone so a
      // failed temp write (e.g. EACCES on a read-only dir) can never delete `dest` with no replacement.
      if (!isWindowsOverwriteError(renameError)) throw renameError;
      removeExistingDest(dest);
      renameSync(tmp, dest);
    }
  } catch (e) {
    discardTmp(tmp);
    throw e;
  }
}

/** Best-effort temp cleanup that never throws, so it can't mask the error being propagated. */
function discardTmp(tmp: string): void {
  try {
    unlinkSync(tmp);
  } catch {}
}

function isWindowsOverwriteError(e: unknown): boolean {
  if (process.platform !== "win32") return false;
  const code = (e as { code?: string } | null)?.code;
  return code === "EEXIST" || code === "EPERM" || code === "EACCES";
}

function removeExistingDest(dest: string): void {
  try {
    unlinkSync(dest);
  } catch (e) {
    // Absent dest is fine — the retry can proceed. Any other unlink failure is the real blocker, so
    // surface it: it explains why the Windows overwrite couldn't complete better than the rename error.
    if ((e as { code?: string } | null)?.code !== "ENOENT") throw e;
  }
}
