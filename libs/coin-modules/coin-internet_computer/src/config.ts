import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type IcpCurrencyConfig = CurrencyConfig;

/** The {@link Context} threaded through the coin-internet_computer API layer (ADR-019). */
export type IcpContext = Context<IcpCurrencyConfig>;
