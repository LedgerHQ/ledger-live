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
  require("electron")
    .ipcRenderer.invoke("getPathUserData")
    .then(path => {
      configDir = path;
    });
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
  require("electron")
    .ipcRenderer.invoke("getPathHome")
    .then(path => {
      homeDir = path;
    });
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
  const replaced = (Object.keys(basePaths) as (keyof typeof basePaths)[]).reduce((path, name) => {
    const p: string = basePaths[name];
    return path
      .replaceAll(p, name) // normal replace of the path
      .replaceAll(encodeURI(p.replace(/\\/g, "/")), name); // replace of the URI version of the path (that are in file:///)
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
          if (seen.has(value as ReplacerArgument)) continue;
          if (typeof value === "string") {
            obj[k] = filepathReplace(value);
          } else {
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
