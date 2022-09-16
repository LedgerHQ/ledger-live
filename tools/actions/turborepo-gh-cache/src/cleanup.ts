import { info, getState } from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { absoluteCacheDirectory, logFileName } from "./utils/constants";

const pid = Number.parseInt(getState("pidToKill"));
const cleanupCacheFolder = getState("cleanupCacheFolder") === "true";

info("Server pid: " + pid);

try {
  if (!isNaN(pid)) {
    process.kill(pid);
  }
} catch (err) {
  console.error(err);
}

try {
  const logFilePath = path.join(absoluteCacheDirectory, logFileName);
  if (fs.existsSync(logFilePath)) {
    info("Server logs:");
    info(
      fs.readFileSync(logFilePath, {
        encoding: "utf8",
        flag: "r",
      })
    );
  }
  // Remove the turbo cache folder to avoid node_modules caching including it.
  if (cleanupCacheFolder) {
    fs.rmdirSync(absoluteCacheDirectory);
  }
} catch (err) {
  console.error(err);
}
