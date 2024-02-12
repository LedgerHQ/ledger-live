import { CustomModule } from "@ledgerhq/wallet-api-client";
import { LoggerParams, LoggerResponse } from "./types";

export class CustomLogger extends CustomModule {
  debug(message: string) {
    return this.request<LoggerParams, LoggerResponse>("custom.logger.debug", { message });
  }

  error(message: string) {
    return this.request<LoggerParams, LoggerResponse>("custom.logger.error", { message });
  }

  info(message: string) {
    return this.request<LoggerParams, LoggerResponse>("custom.logger.info", { message });
  }

  log(message: string) {
    return this.request<LoggerParams, LoggerResponse>("custom.logger.log", { message });
  }

  warn(message: string) {
    return this.request<LoggerParams, LoggerResponse>("custom.logger.warn", { message });
  }
}
