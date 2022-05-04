import winston from "winston";
import simple from "../logs/simple";
import { listen } from "@ledgerhq/logs";

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({
  level: "debug",
  transports: [],
});
const { format } = winston;
const { combine, json } = format;
const winstonFormatJSON = json();
const winstonFormatConsole = combine(
  format(({ type: _type, id: _id, date: _date, ...rest }) => rest)(),
  format.colorize(),
  simple()
);
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};
const level = VERBOSE && VERBOSE in levels ? VERBOSE : "debug";

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormatJSON,
      filename: VERBOSE_FILE,
      level,
    })
  );
}

if (VERBOSE && VERBOSE !== "json") {
  logger.add(
    new winston.transports.Console({
      format: winstonFormatConsole,
      // FIXME: this option is not recognzed by winston API
      // colorize: true,
      level,
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: winstonFormatJSON,
      silent: !VERBOSE,
      level,
    })
  );
}

listen((log) => {
  const { type } = log;
  let level = "info";

  if (type === "libcore-call" || type === "libcore-result") {
    level = "silly";
  } else if (
    type === "apdu" ||
    type === "hw" ||
    type === "speculos" ||
    type.includes("debug") ||
    type.startsWith("libcore")
  ) {
    level = "debug";
  } else if (type.includes("warn")) {
    level = "warn";
  } else if (type.startsWith("network") || type.startsWith("socket")) {
    level = "http";
  } else if (type.includes("error")) {
    level = "error";
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger.log(level, log);
});
