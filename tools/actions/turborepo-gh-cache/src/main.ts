import { info, saveState, setOutput, getInput } from "@actions/core";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";
import { absoluteCacheDirectory, logFileName, portFileName } from "./utils/constants";

const cleanupCacheFolder = getInput("cleanup-cache-folder", {
  required: true,
  trimWhitespace: true,
});
saveState("cleanupCacheFolder", cleanupCacheFolder);

(async () => {
  fs.ensureDirSync(absoluteCacheDirectory);

  const out = fs.openSync(path.join(absoluteCacheDirectory, logFileName), "w");
  const err = fs.openSync(path.join(absoluteCacheDirectory, logFileName), "a");

  const subprocess = spawn("node", [path.resolve(__dirname, "server.js")], {
    detached: true,
    stdio: ["ignore", out, err],
    env: process.env,
  });

  subprocess.unref();

  let interval = null;
  let timeout = null;

  try {
    await Promise.race<string | void>([
      new Promise(resolve => {
        interval = setInterval(() => {
          if (fs.existsSync(path.resolve(absoluteCacheDirectory, portFileName))) {
            const port = fs
              .readFileSync(path.resolve(absoluteCacheDirectory, portFileName))
              .toString();
            info(`Server port: ${port}`);
            setOutput("port", port);
            resolve();
          }
        }, 1000);
      }),
      new Promise((_, reject) => {
        timeout = setTimeout(reject, 10000);
      }),
    ]);
  } catch (error) {
    console.error("Timeout while waiting for the server to boot.");
  } finally {
    clearInterval(interval);
    clearTimeout(timeout);
  }

  info(`Server PID: ${subprocess.pid}`);
  saveState("pidToKill", subprocess.pid);
})();
