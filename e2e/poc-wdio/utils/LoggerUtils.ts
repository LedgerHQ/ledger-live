import { format } from "node:util";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

class LoggerUtils {
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  private formatMessage(...args: unknown[]): string {
    return `${new Date().toISOString()} - ${this.name}: ${format(...args)}`;
  }

  private write(method: LogLevel, ...args: unknown[]): void {
    console[method](this.formatMessage(...args));
  }

  log(...args: unknown[]): void {
    this.write("info", "log", ...args);
  }

  info(...args: unknown[]): void {
    this.write("info", "info", ...args);
  }

  debug(...args: unknown[]): void {
    this.write("debug", "debug", ...args);
  }

  warn(...args: unknown[]): void {
    this.write("warn", "warn", ...args);
  }

  error(...args: unknown[]): void {
    this.write("error", "error", ...args);
  }

  trace(...args: unknown[]): void {
    this.write("trace", "log", ...args);
  }
}

export default LoggerUtils;
