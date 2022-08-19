import { info, saveState } from "@actions/core";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";
import { absoluteCacheDirectory, logFileName } from "./utils/constants";

fs.ensureDirSync(absoluteCacheDirectory);

const out = fs.openSync(path.join(absoluteCacheDirectory, logFileName), "w");
const err = fs.openSync(path.join(absoluteCacheDirectory, logFileName), "a");

const subprocess = spawn("node", [path.resolve(__dirname, "server.js")], {
  detached: true,
  stdio: ["ignore", out, err],
  env: process.env,
});

subprocess.unref();

info(`Server PID: ${subprocess.pid}`);
saveState("pidToKill", subprocess.pid);
