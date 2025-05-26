import { listen } from "@ledgerhq/logs";
import logger, { memoryLogger } from "./logger";

listen(entry => {
  memoryLogger.log(entry, () => {});
  logger.log({
    level: entry.data?.level === 2 ? "error" : entry.data?.level === 1 ? "warn" : "debug",
    message: entry.message || "",
    type: entry.type,
    ...entry.data,
    timestamp: entry.date,
  });
});
