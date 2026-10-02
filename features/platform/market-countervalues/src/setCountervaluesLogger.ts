import { setLogger, type Logger } from "./internals/logger";

/** Routes the package's diagnostics to the app's logger. Call it once at app setup. */
export function setCountervaluesLogger(logger: Logger): void {
  setLogger(logger);
}
