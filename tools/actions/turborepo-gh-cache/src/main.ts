import { info, saveState, setOutput } from "@actions/core";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";
import {
  absoluteCacheDirectory,
  logFileName,
  portFileName,
} from "./utils/constants";

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

  try {
    await Promise.race<string | void>([
      new Promise((resolve) => {
        interval = setInterval(() => {
          if (
            fs.existsSync(path.resolve(absoluteCacheDirectory, portFileName))
          ) {
            const port = fs
              .readFileSync(path.resolve(absoluteCacheDirectory, portFileName))
              .toString();
            info(`Server port: ${port}`);
            setOutput("port", port);
            resolve();
          }
        }, 1000);
      }),
      new Promise((_, reject) => setTimeout(reject, 10000)),
    ]);
  } catch (error) {
    console.error("Timeout while waiting for the server to boot.");
  } finally {
    clearInterval(interval);
  }

  info(`Server PID: ${subprocess.pid}`);
  saveState("pidToKill", subprocess.pid);
})();
