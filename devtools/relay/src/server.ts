import { createRelayHub } from "./relay";

const argv = process.argv;
const insecure = argv.includes("--no-sec") || process.env.RELAY_INSECURE === "true";
const verbose = !argv.includes("--quiet");
const logFileIndex = argv.indexOf("--log");
const logFile = logFileIndex !== -1 ? argv[logFileIndex + 1] : undefined;

if (logFileIndex !== -1 && !logFile) {
  console.error("Error: --log option requires a file path argument.");
  process.exit(1);
}

createRelayHub({ secure: !insecure, verbose, logFile });
