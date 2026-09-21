const { LEDGER_CONFIG_DIRECTORY, HOME_DIRECTORY } = process.env;

// Cache for the renderer only: it can't call app.getPath synchronously, so fetch once over IPC.
let cachedRendererConfigDir = "";
let cachedRendererHomeDir = "";

if (!LEDGER_CONFIG_DIRECTORY && process.type !== "browser") {
  // we load in async the user data. there is a short period where this will be "" but then it becomes the real path
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require("electron");
  const ipc = electron?.ipcRenderer ?? electron?.default?.ipcRenderer;
  if (ipc && typeof ipc.invoke === "function") {
    const promise = ipc.invoke("getPathUserData");
    if (promise != null && typeof promise.then === "function") {
      promise.then((path: string) => {
        cachedRendererConfigDir = path;
      });
    }
  }
}

if (!HOME_DIRECTORY && process.type !== "browser") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require("electron");
  const ipc = electron?.ipcRenderer ?? electron?.default?.ipcRenderer;
  if (ipc && typeof ipc.invoke === "function") {
    const promise = ipc.invoke("getPathHome");
    if (promise != null && typeof promise.then === "function") {
      promise.then((path: string) => {
        cachedRendererHomeDir = path;
      });
    }
  }
}

// Resolved fresh on every call in the main process (a cheap sync Electron call), rather than
// cached at module load, since app.setPath() (e.g. the legacy "Ledger Live" migration) can
// change it after this module first loads.
function getConfigDir(): string {
  if (LEDGER_CONFIG_DIRECTORY) return LEDGER_CONFIG_DIRECTORY;
  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("electron").app.getPath("userData");
  }
  return cachedRendererConfigDir;
}

function getHomeDir(): string {
  if (HOME_DIRECTORY) return HOME_DIRECTORY;
  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("electron").app.getPath("home");
  }
  return cachedRendererHomeDir;
}

function filepathReplace(path: string): string {
  const configDir = getConfigDir();
  const homeDir = getHomeDir();
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
