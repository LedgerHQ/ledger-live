import { createWriteStream } from "node:fs";
import type { Logger } from "./types";

export function createLogger({
  verbose = true,
  logFile,
}: {
  verbose?: boolean;
  logFile?: string;
}): Logger {
  const stream = logFile ? createWriteStream(logFile, { flags: "a" }) : null;
  const log = (msg: string) => (stream ? stream.write(msg + "\n") : console.log(msg));
  const warn = (msg: string) => (stream ? stream.write("[warn] " + msg + "\n") : console.warn(msg));
  const trace = (msg: string) => {
    if (verbose) log(msg);
  };
  const write = (s: string) => (stream ? stream.write(s) : process.stdout.write(s));
  const close = () => stream?.end();
  return { log, warn, trace, write, close };
}
