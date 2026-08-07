import { log } from "@ledgerhq/logs";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { EvmConfigInfo, EvmContext } from "../config";

/**
 * Builds a mock {@link EvmContext} for tests.
 *
 * The logic layer resolves its configuration through `context.config(currency.id)`, so this
 * accessor is the single source of config for the delegated calls. Pass an optional `config`
 * to override what `context.config()` resolves to (merged over an `active` status default).
 * The `currencyId` argument is accepted for signature parity but ignored — the mock always
 * resolves the same config regardless of currency.
 */
export const createMockEvmContext = (config?: Partial<EvmConfigInfo>): EvmContext => ({
  config: async (_currencyId?: string): Promise<EvmConfigInfo> =>
    ({ status: { type: "active" }, ...config }) as EvmConfigInfo,
  logger: log as unknown as Logger,
});

/** A ready-to-use mock {@link EvmContext} for tests that don't need a custom config. */
export const mockEvmContext: EvmContext = createMockEvmContext();
