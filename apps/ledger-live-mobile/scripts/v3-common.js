const { execFile } = require("node:child_process");
const { accessSync, constants, existsSync } = require("node:fs");

/**
 * Candidate absolute paths for git (Sonar S4036: no shell / arbitrary PATH; pick first executable).
 * Covers system git, Intel Homebrew, and Apple Silicon Homebrew.
 */
const GIT_CANDIDATES = ["/usr/bin/git", "/usr/local/bin/git", "/opt/homebrew/bin/git"];

const gitFromEnv = process.env.GIT_PATH?.trim();
const GIT_PATH = (() => {
  if (gitFromEnv) return gitFromEnv;
  const found = GIT_CANDIDATES.find(p => {
    try {
      if (existsSync(p)) {
        accessSync(p, constants.X_OK);
        return true;
      }
    } catch {
      // not found or not executable
    }
    return false;
  });
  if (found) return found;
  throw new Error(
    "Could not find git in standard locations; set GIT_PATH to the full path to the git executable.",
  );
})();

/**
 * Run a command without shell interpretation (avoids command injection).
 * Resolves with stdout; rejects when execFile reports an error (non-zero exit, missing executable, etc.).
 */
function executeAsync(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 10 * 1024 * 1024, encoding: "utf8" }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

/** List { tsFilePath, jsFilePath } pairs for files that have both .ts/.tsx and .js in git. */
async function listTsJsFilesPairs() {
  const jsFilesPath = {};
  const jsTsPairs = [];
  const output = await executeAsync(GIT_PATH, ["ls-files"]);
  const lines = output.split("\n").filter(Boolean);
  for (const p of lines) {
    if (p.endsWith(".js")) jsFilesPath[p] = true;
  }
  for (const p of lines) {
    if (p.endsWith(".ts") || p.endsWith(".tsx")) {
      const beforeExtensionPath = p.split(".").slice(0, -1).join(".");
      const jsFilePath = `${beforeExtensionPath}.js`;
      if (jsFilesPath[jsFilePath]) {
        jsTsPairs.push({ tsFilePath: p, jsFilePath });
      }
    }
  }
  return jsTsPairs;
}

module.exports = { executeAsync, listTsJsFilesPairs, GIT_PATH };
