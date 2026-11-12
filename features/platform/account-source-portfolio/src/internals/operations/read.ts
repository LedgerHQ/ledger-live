import type { UpdatesPage } from "@domain/api-account-portfolio";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { AccountOperationsQuery } from "@domain/entity-account-operation";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import { findFiatCurrencyByTicker, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import type { PortfolioClient } from "../../client";
import { isEvmAccount } from "../../evm";
import { orCancelled } from "../cancellation";

const DEFAULT_LIMIT = 20;

/** The query's limit when it is a positive integer, else 20. */
export function limitOf(query: AccountOperationsQuery | undefined): number {
  const requested = query?.limit ?? DEFAULT_LIMIT;
  return Number.isInteger(requested) && requested > 0 ? requested : DEFAULT_LIMIT;
}

/** The countervalue currency, how the service names it, and how many decimals its smallest unit has. */
export type Fiat = { ticker: FiatCurrencyTicker; currency: string; magnitude: number };

/** The countervalues that are not ISO 4217 codes, by the CAL id the service takes for them. */
const CRYPTO_COUNTERVALUES: Readonly<Record<string, string>> = { BTC: "bitcoin", XBT: "bitcoin" };

/**
 * Undefined when the query asks for no countervalue, or for an unknown one. The service takes an
 * ISO 4217 code or a CAL currency id: BTC or XBT goes as `bitcoin`, a fiat such as MNT stays as is.
 */
export function fiatOf(query: AccountOperationsQuery | undefined): Fiat | undefined {
  const ticker = query?.countervalue;
  const unit = ticker && findFiatCurrencyByTicker(ticker)?.units[0];
  if (!ticker || !unit) return undefined;
  const currency = Object.hasOwn(CRYPTO_COUNTERVALUES, ticker)
    ? CRYPTO_COUNTERVALUES[ticker]
    : ticker;
  return { ticker, currency, magnitude: unit.magnitude };
}

/**
 * The service's `asset` for a filter, `{}` to ask for every update, or undefined when the filter
 * matches nothing on this account. The coin stays filtered locally: the service's `native` leaves
 * out the updates where the coin only pays the fee, such as a token send.
 */
export async function serviceAssetOf(
  client: PortfolioClient,
  descriptor: AccountDescriptor,
  filterAsset: CryptoOrTokenCurrencyId | undefined,
  signal?: AbortSignal,
): Promise<{ asset?: string } | undefined> {
  if (filterAsset === undefined || filterAsset === currencyIdFromNetwork(descriptor.network))
    return {};
  // Outside EVM the service's token asset (`token.trc20.<base58>`) cannot be spelled: filtered locally.
  if (!isEvmAccount(descriptor)) return {};
  const token = await orCancelled(client.findToken(filterAsset), signal);
  if (!token || token.parentCurrencyId !== currencyIdFromNetwork(descriptor.network))
    return undefined;
  return { asset: `${token.tokenType}.${token.contractAddress.toLowerCase()}` };
}

export type UpdatesRequest = { limit: number; cursor?: string; asset?: string; fiat?: Fiat };

/** One page of the account's updates; the cursor is the service's own page token. `signal` cancels it. */
export const readUpdates = (
  client: PortfolioClient,
  portfolioId: PortfolioId,
  account: string,
  { limit, cursor, asset, fiat }: UpdatesRequest,
  signal?: AbortSignal,
): Promise<UpdatesPage> =>
  client.getUpdates(
    portfolioId,
    {
      account,
      size: limit,
      token: cursor,
      ...(asset === undefined ? {} : { asset }),
      ...(fiat === undefined ? {} : { currency: fiat.currency }),
    },
    signal,
  );
