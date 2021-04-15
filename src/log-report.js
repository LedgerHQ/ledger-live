/* eslint-disable no-console */
// @flow
import { listen } from "@ledgerhq/logs";

const logs = [];
const logLimit = 1000; // the number of latest log we want to conserve
export default {
  logReportInit: () => {
    listen(log => {
      logs.unshift(log);
      if (logs.length > logLimit) {
        logs.pop();
      }
    });
  },
  getLogs: () => logs,
};
