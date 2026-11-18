import { realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { isAbsolute, relative, sep } from "node:path";

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
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
};

export function isUnderTemporaryDir(dir: string, roots: readonly string[]): boolean {
  const real = resolve(dir);
  // Compare both spellings: on macOS `/tmp` resolves to `/private/tmp`.
  return roots.some(root => inside(dir, root) || inside(real, resolve(root)));
}

/** The roots to check. `XDG_RUNTIME_DIR` is a tmpfs wiped on logout or reboot. `tmpdir()` comes
 * from `TMPDIR`/`TEMP`/`TMP`, so it is skipped when it holds the home folder (e.g. `TMPDIR=$HOME`),
 * which would flag the persistent default state dir. */
export function temporaryRoots(
  env: NodeJS.ProcessEnv = process.env,
  tmp: string = tmpdir(),
  home: string = homedir(),
): string[] {
  const roots = [...TEMP_ROOTS];
  if (env.XDG_RUNTIME_DIR) roots.push(env.XDG_RUNTIME_DIR);
  if (!inside(home, tmp) && !inside(resolve(home), resolve(tmp))) roots.push(tmp);
  return roots;
}

/** Warns that the agent's profile would be lost on restart, since `session.yaml` lives in the
 * state dir and the keychain entry name is derived from that dir's path. */
export function temporaryStateDirWarning(
  dir: string,
  platform: NodeJS.Platform = process.platform,
  roots: readonly string[] = temporaryRoots(),
): string | undefined {
  if (!isUnderTemporaryDir(dir, roots)) return undefined;
  // `stateDir()` reads LOCALAPPDATA on Windows and XDG_STATE_HOME elsewhere.
  const envVar = platform === "win32" ? "LOCALAPPDATA" : "XDG_STATE_HOME";
  return (
    `⚠ Agent Intent profiles are saved in ${dir}, which is temporary storage and is ` +
    `usually wiped on restart. Set ${envVar} to a persistent folder, or this agent will ` +
    "lose its profile.\n"
  );
}
