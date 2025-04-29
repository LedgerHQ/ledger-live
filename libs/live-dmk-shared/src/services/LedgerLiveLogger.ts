import { log } from "@ledgerhq/logs";
import {
  LoggerSubscriberService,
  LogLevel,
  LogSubscriberOptions,
} from "@ledgerhq/device-management-kit";

export class LedgerLiveLogger implements LoggerSubscriberService {
  private readonly maxLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.Debug) {
    this.maxLevel = level;
  }

  log(level: LogLevel | null, message: string, options: LogSubscriberOptions): void {
    if (level !== null && level > this.maxLevel) {
      return;
    }
    log("live-dmk-logger", message, { level, ...options });
  }
}
