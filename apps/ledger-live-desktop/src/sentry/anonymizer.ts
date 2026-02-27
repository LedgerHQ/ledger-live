let configDir = (() => {
  const { LEDGER_CONFIG_DIRECTORY } = process.env;
  if (LEDGER_CONFIG_DIRECTORY) return LEDGER_CONFIG_DIRECTORY;
  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require("electron");
    return electron.app.getPath("userData");
  }

  // we load in async the user data. there is a short period where this will be "" but then it becomes the real path
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const invoke = require("electron")?.ipcRenderer?.invoke;
  if (typeof invoke === "function") {
    invoke("getPathUserData").then((path: string) => {
      configDir = path;
    });
  }
  return "";
})();

let homeDir = (() => {
  const { HOME_DIRECTORY } = process.env;
  if (HOME_DIRECTORY) return HOME_DIRECTORY;
  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require("electron");
    return electron.app.getPath("home");
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const invoke = require("electron")?.ipcRenderer?.invoke;
  if (typeof invoke === "function") {
    invoke("getPathHome").then((path: string) => {
      homeDir = path;
    });
  }
  return "";
})();

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
