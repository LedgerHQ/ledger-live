import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: { target: "pino-pretty", options: { colorize: process.env.NODE_ENV !== "test" } },
});

export function setLogLevel(level: string): void {
  logger.level = level;
}
