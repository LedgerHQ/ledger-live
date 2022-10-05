import "./env";
import axios from "axios";
import { setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { listen as listenLogs } from "@ledgerhq/logs";
import logger from "./logger";

// To let TS knows it can expect to find this global variable
declare const __APP_VERSION__: string;

// Sets the device actions implementation to "polling", and not "event"
setDeviceMode("polling");

listenLogs(({ id: _id, date: _date, ...log }) => {
  if (log.type === "hid-frame") return;
  logger.debug(log);
});

if (process.env.NODE_ENV === "production") {
  axios.defaults.headers.common["User-Agent"] = `Live-Desktop/${__APP_VERSION__}`;
}
