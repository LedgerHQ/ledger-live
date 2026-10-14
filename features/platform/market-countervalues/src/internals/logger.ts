// The app registers its logger at setup, so the package depends on no logging library. Until then,
// diagnostics are dropped.

export type Logger = (type: string, message: string, data?: unknown) => void;

let current: Logger = () => {};

export function setLogger(logger: Logger): void {
  current = logger;
}

export function log(...args: Parameters<Logger>): void {
  current(...args);
}
