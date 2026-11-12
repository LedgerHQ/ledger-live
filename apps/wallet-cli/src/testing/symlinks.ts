import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const linkDirectory = (target: string, link: string): Promise<void> =>
  symlink(target, link, "junction");

export const canSymlinkFiles = process.platform !== "win32" || probeFileSymlink();

export function probeFileSymlink(createSymlink: typeof symlinkSync = symlinkSync): boolean {
  const dir = mkdtempSync(join(tmpdir(), "wallet-cli-symlink-probe-"));
  try {
    createSymlink(join(dir, "target"), join(dir, "link"), "file");
    return true;
  } catch (e) {
    if ((e as { code?: string } | null)?.code !== "EPERM") throw e;
    return false;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
