import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, relative } from "node:path";

/** Folders that are usually wiped on restart. `/var/tmp` is left out: it survives reboots. */
const TEMP_ROOTS = ["/tmp", "/private/tmp", "/dev/shm"];

const resolve = (path: string): string => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

const inside = (path: string, root: string): boolean => {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

export function isUnderTemporaryDir(dir: string, roots: readonly string[]): boolean {
  const real = resolve(dir);
  // Compare both spellings: on macOS `/tmp` resolves to `/private/tmp`.
  return roots.some(root => inside(dir, root) || inside(real, resolve(root)));
}

/** Warns that the agent's profile would be lost on restart, since `session.yaml` lives in the
 * state dir and the keychain entry name is derived from that dir's path. */
export function temporaryStateDirWarning(
  dir: string,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  if (!isUnderTemporaryDir(dir, [...TEMP_ROOTS, tmpdir()])) return undefined;
  // `stateDir()` reads LOCALAPPDATA on Windows and XDG_STATE_HOME elsewhere.
  const envVar = platform === "win32" ? "LOCALAPPDATA" : "XDG_STATE_HOME";
  return (
    `Warning: Agent Intent profiles are saved in ${dir}, which is temporary storage and is ` +
    `usually wiped on restart. Set ${envVar} to a persistent folder, or this agent will ` +
    "lose its profile.\n"
  );
}
