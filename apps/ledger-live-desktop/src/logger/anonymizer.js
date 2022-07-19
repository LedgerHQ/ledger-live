// @flow

const configDir = (() => {
  const { LEDGER_CONFIG_DIRECTORY } = process.env;
  if (LEDGER_CONFIG_DIRECTORY) return LEDGER_CONFIG_DIRECTORY;
  // $FlowFixMe
  const electron = process.type === "browser" ? require("electron") : require("@electron/remote");
  return electron.app.getPath("userData") || "__NOTHING_TO_REPLACE__";
})();

const homeDir = (() => {
  const { HOME_DIRECTORY } = process.env;
  if (HOME_DIRECTORY) return HOME_DIRECTORY;
  // $FlowFixMe
  const electron = process.type === "browser" ? require("electron") : require("@electron/remote");
  return electron.app.getPath("home") || "__NOTHING_TO_REPLACE__";
})();

// all the paths the app will use. we replace them to anonymize
const basePaths = {
  $USER_DATA: configDir,
  ".": homeDir,
};

function filepathReplace(path: string) {
  if (!path || path.startsWith("app://")) return path;
  const replaced = Object.keys(basePaths).reduce((path, name) => {
    const p = basePaths[name];
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

function filepathRecursiveReplacer(obj: mixed, seen: Array<*>) {
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
          if (seen.indexOf(value) !== -1) return;
          if (typeof value === "string") {
            // $FlowFixMe
            obj[k] = filepathReplace(value);
          } else {
            filepathRecursiveReplacer(obj[k], seen);
          }
        }
      }
    }
  }
}

export default {
  filepath: filepathReplace,
  filepathRecursiveReplacer: (obj: mixed) => filepathRecursiveReplacer(obj, []),
};
