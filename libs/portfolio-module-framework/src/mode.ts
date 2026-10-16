import type { Network } from "./types";

/**
 * Which implementation serves a network, set per chain in its coin config:
 * - `local`: registered, synced, read and written by the client's account modules;
 * - `remote`: registered, read and written by the portfolio-service;
 * - `hybrid`: registered on both; reads come from the portfolio-service, writes stay local, where the
 *   account module crafts with the account's own inputs and change.
 */
export type PortfolioMode = "local" | "hybrid" | "remote";

export const PORTFOLIO_MODES: readonly PortfolioMode[] = ["local", "hybrid", "remote"];

export const DEFAULT_PORTFOLIO_MODE: PortfolioMode = "local";

/** The portfolio part of a coin config (`CurrencyConfig`, the `config_currency_<id>` of a chain). */
export type PortfolioCoinConfig = {
  portfolio?: {
    /** The chain's accounts are served through the portfolio layer; otherwise by the legacy bridge. */
    enabled?: boolean;
    mode?: PortfolioMode;
  };
};

/** Whether a coin config routes its chain through the portfolio layer: only when it says so. */
export const isPortfolioEnabled = (coinConfig: unknown): boolean =>
  (coinConfig as PortfolioCoinConfig | null | undefined)?.portfolio?.enabled === true;

const isPortfolioMode = (value: unknown): value is PortfolioMode =>
  PORTFOLIO_MODES.includes(value as PortfolioMode);

/** The mode a coin config sets; `fallback` when it sets none, or one this version does not know. */
export function portfolioModeOf(
  coinConfig: unknown,
  fallback: PortfolioMode = DEFAULT_PORTFOLIO_MODE,
): PortfolioMode {
  const mode = (coinConfig as PortfolioCoinConfig | null | undefined)?.portfolio?.mode;
  return isPortfolioMode(mode) ? mode : fallback;
}

/**
 * Reads the mode of each network from its coin config. `coinConfigOf` maps a network to its coin
 * config; a network without one, or whose lookup fails, gets `fallback`.
 */
export const portfolioModesFromCoinConfig =
  (coinConfigOf: (network: Network) => unknown, fallback: PortfolioMode = DEFAULT_PORTFOLIO_MODE) =>
  async (network: Network): Promise<PortfolioMode> => {
    try {
      return portfolioModeOf(await coinConfigOf(network), fallback);
    } catch {
      return fallback;
    }
  };
