import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import {
  getValidators as coinEvmValidators,
  isSeiAccountUnassociated as coinEvmSeiAccountUnassociated,
  prefetchValidators as coinEvmPrefetchValidators,
} from "@ledgerhq/coin-evm/staking";
import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/types";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { isPortfolioEnabled, type ValidatorView } from "@ledgerhq/portfolio-module-framework";
import { findCryptoCurrency, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCurrencyConfiguration } from "../../../config";
import { chainReadsFor } from "../../../bridge/generic-coin-framework/chainReads";
import { openCurrencyPortfolio } from "../../../bridge/generic-coin-framework/networkPortfolio";
import { isPortfolioEnabledFor } from "../../../bridge/generic-coin-framework/portfolio/config";
import { getAccountReadiness } from "../bridge/api";

/**
 * The currency the portfolio layer serves with `config`, its coin config: the EVM currency whose
 * coin config enables the portfolio on the same chain id (coin-evm keys a chain on it, so the
 * staking screens hand over the config alone). undefined when the config leaves the currency on the
 * legacy path, or when no currency answers it.
 */
const portfolioCurrencyOf = (config: EvmConfigInfo): CryptoCurrency | undefined =>
  isPortfolioEnabled(config)
    ? findCryptoCurrency(
        currency =>
          currency.family === "evm" &&
          isPortfolioEnabledFor(currency.id) &&
          getCurrencyConfiguration<EvmConfigInfo>(currency.id).chainId === config.chainId,
      )
    : undefined;

/**
 * A validator as the portfolio answers it, in coin-evm's form. Its id is the coin module's (the
 * local side answers it), else its address, as the coin module framework has it: the service
 * answers none, and writes no staking intent either.
 */
const fromValidatorView = (view: ValidatorView): Validator => ({
  id: view.id ?? view.address,
  address: view.address,
  name: view.name,
  description: view.description,
  url: view.url,
  logo: view.logo,
  balance: view.balance === undefined ? undefined : BigInt(view.balance),
  commissionRate: view.commissionRate,
  apy: view.apy,
});

/**
 * A page of the validators of an EVM staking chain (the staking screens' list): through the
 * portfolio layer when the coin config enables it, from coin-evm otherwise.
 */
export async function getValidators(
  config: EvmConfigInfo,
  logger: Logger,
  cursor?: Cursor,
): Promise<Page<Validator>> {
  const currency = portfolioCurrencyOf(config);
  if (!currency) {
    return coinEvmValidators(config, logger, cursor);
  }
  const { portfolio, network } = await openCurrencyPortfolio(currency, "read");
  const { items = [], next } = await portfolio.getValidators(
    network,
    cursor === undefined ? {} : { cursor },
  );
  return { items: items.map(fromValidatorView), ...(next ? { next } : {}) };
}

/**
 * Warms coin-evm's validator cache before the staking screens open. Nothing to warm when the
 * portfolio layer serves the currency: the list is read through it when the screens ask.
 */
export function prefetchValidators(config: EvmConfigInfo, logger: Logger): void {
  if (portfolioCurrencyOf(config)) return;
  coinEvmPrefetchValidators(config, logger);
}

/**
 * Whether a Sei account still has to associate its EVM address with its Cosmos one before it can
 * stake. When the portfolio layer serves the currency, the readiness the sync computes answers it
 * (the address precompile, read through the portfolio's `call`); a portfolio that cannot make the
 * call (`remote` mode) shows no warning.
 */
export async function isSeiAccountUnassociated(
  config: EvmConfigInfo,
  freshAddress: string,
): Promise<boolean> {
  const currency = portfolioCurrencyOf(config);
  if (!currency) {
    return coinEvmSeiAccountUnassociated(config, freshAddress);
  }
  try {
    const readiness = await getAccountReadiness(
      currency,
      freshAddress,
      await chainReadsFor(currency),
    );
    return !readiness.ready;
  } catch (error) {
    if (error instanceof ChainReadUnsupportedError) return false;
    throw error;
  }
}
