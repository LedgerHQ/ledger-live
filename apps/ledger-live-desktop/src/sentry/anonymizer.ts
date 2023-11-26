import resolveUserDataDirectory from "~/helpers/resolveUserDataDirectory";

const configDir = resolveUserDataDirectory();
const homeDir = (() => {
  const { HOME_DIRECTORY } = process.env;
  if (HOME_DIRECTORY) return HOME_DIRECTORY;
  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require("electron");
    return electron.app.getPath("home");
  }
  return window.api.pathHome;
})();

// all the paths the app will use. we replace them to anonymize
const basePaths = {
  $USER_DATA: configDir,
  ".": homeDir,
};
function filepathReplace(path: string): string {
  if (!path || path.startsWith("app://")) return path;
  const replaced = (Object.keys(basePaths) as (keyof typeof basePaths)[]).reduce((path, name) => {
    const p: string = basePaths[name];
    return path
      .replace(p, name) // normal replace of the path
      .replace(encodeURI(p.replace(/\\/g, "/")), name); // replace of the URI version of the path (that are in file:///)
  }, path);
  if (replaced.length !== path.length) {
    // we need to continue until there is no more occurences
    return filepathReplace(replaced);
  }
  return replaced;
}

export type ReplacerArgument = Record<string, unknown>;

function filepathRecursiveReplacer(obj: ReplacerArgument, seen: Array<ReplacerArgument>) {
  if (obj && typeof obj === "object") {
    seen.push(obj);
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const item = obj[i];
        if (seen.indexOf(item) !== -1) return;
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
          if (seen.indexOf(value as ReplacerArgument) !== -1) return;
          if (typeof value === "string") {
            obj[k] = filepathReplace(value);
          } else {
            filepathRecursiveReplacer(obj[k] as ReplacerArgument, seen);
          }
        }
      }
    }
  }
}
export default {
  filepath: filepathReplace,
  filepathRecursiveReplacer: (obj: ReplacerArgument) => filepathRecursiveReplacer(obj, []),
};
