export const methodIds = [
  "custom.logger.debug",
  "custom.logger.error",
  "custom.logger.info",
  "custom.logger.log",
  "custom.logger.warn",
] as const;

export type MethodIds = (typeof methodIds)[number];

export type LoggerParams = {
  message: string;
};

export type LoggerResponse = void;
