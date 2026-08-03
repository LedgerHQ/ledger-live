import { bootstrap } from "~/renderer/bridge";

/**
 * Paths scrubbed out of telemetry. Read from the bootstrap snapshot so they are set from the
 * first log line: `filepathReplace` blanks its input entirely while they are unset, so the
 * previous async IPC lookup meant early errors were reported with no path information.
 */
const configDir = bootstrap.env.LEDGER_CONFIG_DIRECTORY || bootstrap.paths.userData;
const homeDir = bootstrap.env.HOME_DIRECTORY || bootstrap.paths.home;

function filepathReplace(path: string): string {
  // all the paths the app will use. we replace them to anonymize
  const basePaths = {
    $USER_DATA: configDir,
    $HOME: homeDir,
  };

  if (!homeDir || !configDir) return ""; // empty everything because we don't know the paths yet
  if (!path || path.startsWith("app://")) return path;
  const normalizedPath = (p: string) => p.replaceAll("\\", "/");
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const replaced = (Object.keys(basePaths) as (keyof typeof basePaths)[]).reduce((path, name) => {
    const p: string = basePaths[name];
    const norm = normalizedPath(p);
    return path
      .replaceAll(p, name) // raw path
      .replaceAll(encodeURI(norm), name) // URI form (e.g. file://, encodeURI leaves / as /)
      .replaceAll(encodeURIComponent(norm), name); // query-param form (e.g. ?appDirname=%2FUsers%2F...)
  }, path);
  return replaced;
}

export type ReplacerArgument = Record<string, unknown>;

function filepathRecursiveReplacer(obj: ReplacerArgument, seen: Set<ReplacerArgument>) {
  if (seen.has(obj)) return;
  if (obj && typeof obj === "object") {
    seen.add(obj);
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        if (seen.has(item)) continue;
        if (typeof item === "string") {
          obj[i] = filepathReplace(item);
        } else {
          filepathRecursiveReplacer(item, seen);
        }
      }
    } else {
      if (obj instanceof Error) {
        obj.message = filepathReplace(obj.message);
      }
      for (const k in obj) {
        // eslint-disable-next-line no-prototype-builtins
        if (typeof obj.hasOwnProperty === "function" && obj.hasOwnProperty(k)) {
          const value = obj[k];
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          if (seen.has(value as ReplacerArgument)) continue;
          if (typeof value === "string") {
            obj[k] = filepathReplace(value);
          } else {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            filepathRecursiveReplacer(value as ReplacerArgument, seen);
          }
        }
      }
    }
  }
}
export default {
  filepath: filepathReplace,
  filepathRecursiveReplacer: (obj: ReplacerArgument) => filepathRecursiveReplacer(obj, new Set()),
};
