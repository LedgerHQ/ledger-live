import { CustomModule } from "@ledgerhq/wallet-api-client";

export class CustomLogger extends CustomModule {
  debug(message: string) {
    return this.request("custom.logger.debug", { message });
  }

  error(message: string) {
    return this.request("custom.logger.error", { message });
  }

  info(message: string) {
    return this.request("custom.logger.info", { message });
  }

  log(message: string) {
    return this.request("custom.logger.log", { message });
  }

  warn(message: string) {
    return this.request("custom.logger.warn", { message });
  }
}
