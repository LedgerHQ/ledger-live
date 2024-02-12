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
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: getInput("aws-access-key"),
      AWS_SECRET_ACCESS_KEY: getInput("aws-secret-key"),
      AWS_SESSION_TOKEN: getInput("aws-session-token"),
    },
  });

  subprocess.unref();

  let interval: ReturnType<typeof setInterval> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

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
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
  }

  info(`Server PID: ${subprocess.pid}`);
  saveState("pidToKill", subprocess.pid);
})();
