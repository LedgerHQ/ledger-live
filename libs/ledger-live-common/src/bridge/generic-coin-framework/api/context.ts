import { log } from "@ledgerhq/logs";
import type { Context, CurrencyConfig, Logger } from "@ledgerhq/coin-module-framework/config";
import { getCurrencyConfiguration } from "../../../config";

const safeStringify = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "bigint") return `${value}n`;
  const ancestors: object[] = [];
  const result = JSON.stringify(value, function (this: object, _, v: unknown) {
    if (typeof v === "bigint") return `${v}n`;
    if (typeof v === "object" && v !== null) {
      ancestors.splice(ancestors.indexOf(this) + 1);
      if (ancestors.includes(v)) return "[Circular]";
      ancestors.push(v);
    }
    return v;
  });
  return result ?? String(value);
};

/**
 * Adapter wrapping `log` to satisfy the `Logger` (`...args: unknown[]`) signature.
 */
export const contextLogger: Logger = (...args: unknown[]) => {
  const [type, message, data] = args;

  log(safeStringify(type), message === undefined ? undefined : safeStringify(message), data);
};

/**
 * Build the {@link Context} the generic-coin-framework passes to every coin-module method
 * (framework v6, ADR-019). Config is resolved lazily from the currency configuration.
 *
 * The context intentionally carries only `config` + `logger` — never a `currencyId`. Chain-selecting
 * modules capture the currencyId at `createApi(config, currencyId)` time instead.
 */
export function buildContext<ConfigType extends CurrencyConfig>(
  currencyId: string,
): Context<ConfigType> {
  return {
    config: async (id?: string) => getCurrencyConfiguration<ConfigType>(id ?? currencyId),
    logger: contextLogger,
  };
}
