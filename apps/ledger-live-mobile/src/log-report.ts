import { listen, Log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-common/env";

const logs: Log[] = [];
const logLimit = getEnv("EXPORT_MAX_LOGS");
const excludedLogTypes = getEnv("EXPORT_EXCLUDED_LOG_TYPES").split(",");

export default {
  logReportInit: () => {
    listen(log => {
      if (!excludedLogTypes.includes(log.type)) {
        logs.unshift(log);

        if (logs.length > logLimit) {
          logs.pop();
        }
      }
    });
  },
  getLogs: () => logs,
};
