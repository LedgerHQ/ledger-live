import { log } from "@ledgerhq/logs";
import type { Context, Logger } from "@ledgerhq/coin-module-framework/config";
import { getCurrencyConfiguration } from "../../../config";

/**
 * Build the {@link Context} the generic-coin-framework passes to every coin-module method
 * (framework v6, ADR-019). Config is resolved lazily from the currency configuration.
 *
 * The context intentionally carries only `config` + `logger` — never a `currencyId`. Chain-selecting
 * modules capture the currencyId at `createApi(config, currencyId)` time instead.
 */
export function buildContext(currencyId: string): Context<any> {
  return {
    config: async (id?: string) => getCurrencyConfiguration(id ?? currencyId),
    // Pass every argument straight through to `log`; the caller decides the level/message/data.
    logger: log as unknown as Logger,
  };
}
