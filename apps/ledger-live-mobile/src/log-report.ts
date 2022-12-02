import { listen, Log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-common/env";

const logs: Log[] = [];
export default {
  logReportInit: () => {
    listen(log => {
      const logLimit = getEnv("EXPORT_MAX_LOGS");
      const excludedLogTypes = getEnv("EXPORT_EXCLUDED_LOG_TYPES").split(",");

      if (!excludedLogTypes.includes(log.type)) {
        logs.unshift(log);

        while (logs.length > logLimit) {
          logs.pop();
        }
      }
    });
  },
  getLogs: () => logs,
};
