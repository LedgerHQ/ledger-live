/* eslint-disable no-console */
import winston from "winston";
import { listen } from "@ledgerhq/logs";
import "./setup";
import { EnvName, setEnvUnsafe } from "../../env";

let setupCalled = null;
export const setup = (testId) => {
  if (setupCalled) {
    throw new Error(
      "setup(" + testId + "): was already called with " + setupCalled
    );
  }
  setupCalled = testId;
};

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({
  level: "debug",
  transports: [],
});
const { format } = winston;
const { combine, timestamp, json } = format;
const winstonFormat = combine(timestamp(), json());

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormat,
      filename: VERBOSE_FILE,
      level: "debug",
    })
  );
}

logger.add(
  new winston.transports.Console({
    format: winstonFormat,
    silent: !VERBOSE,
  })
);
// eslint-disable-next-line no-unused-vars
listen(({ type, message, ...rest }) => {
  logger.log("debug", {
    message: type + (message ? ": " + message : ""),
    // $FlowFixMe
    ...rest,
  });
});
