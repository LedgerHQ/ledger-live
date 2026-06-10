import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import BigNumber from "bignumber.js";
import { toSlug } from "./toSlug";
import type {
  AssetsDataLike,
  BuildAssetDistributionOpts,
  AssetsDistribution,
  DistributionItem,
  CurrencyLookups,
  MetaGroup,
} from "./types";

function getAccountCurrency(account: AccountLike): CryptoCurrency | TokenCurrency {
  return account.type === "Account" ? account.currency : account.token;
}

function shouldSkipAccount(
  account: AccountLike,
  showEmptyAccounts: boolean,
  hideEmptyTokenAccount: boolean,
): boolean {
  if (account.balance.isGreaterThan(0)) return false;
  return account.type === "TokenAccount" ? hideEmptyTokenAccount : !showEmptyAccounts;
}

function buildCurrencyLookups(cryptoAssets: AssetsDataLike["cryptoAssets"]): CurrencyLookups {
  const currencyToMetaId: Record<string, string> = {};
  const primaryAssets: Record<string, string> = {};
  for (const [metaId, meta] of Object.entries(cryptoAssets)) {
    const assetIds = Object.values(meta.assetsIds);
    if (assetIds[0]) primaryAssets[metaId] = assetIds[0];
    for (const assetId of assetIds) currencyToMetaId[assetId] = metaId;
  }
  return { currencyToMetaId, primaryAssets };
}

function resolveNormalizedCurrency(metaCurrencyId: string): CryptoCurrency | undefined {
  return findCryptoCurrencyById(toSlug(metaCurrencyId));
}

function computeDistribution(countervalue: number, sum: number, fallback: number): number {
  if (sum !== 0) return countervalue / sum;
  return fallback;
}

function buildSlugIndex(list: DistributionItem[]): Record<string, DistributionItem> {
  const index: Record<string, DistributionItem> = {};
  for (const item of list) {
    if (item.slug) index[item.slug] = item;
  }
  return index;
}

function sumNetworkAmountsAtReferenceMagnitude(
  networks: MetaGroup["networks"],
  referenceMagnitude: number,
): number {
  return Array.from(networks.values())
    .reduce((total, network) => {
      const currentMagnitude = network.currency.units[0]?.magnitude ?? 0;
      const normalizedAmount = new BigNumber(network.amount).shiftedBy(
        referenceMagnitude - currentMagnitude,
      );
      return total.plus(normalizedAmount);
    }, new BigNumber(0))
    .toNumber();
}

const EMPTY_DISTRIBUTION: AssetsDistribution = Object.freeze({
  isAvailable: false,
  list: [],
  showFirst: 0,
  sum: 0,
});

/**
 * Groups accounts by DADA meta-currency (cross-network), computes
 * countervalues per unique currency (aggregated), and produces the
 * full AssetsDistribution with slug, marketId, and per-network breakdown.
 */
export function buildAssetDistribution(
  topAccounts: Account[],
  cvState: CounterValuesState,
  to: Currency,
  assetsData: AssetsDataLike,
  opts?: BuildAssetDistributionOpts,
): AssetsDistribution {
  const showEmptyAccounts = opts?.showEmptyAccounts ?? false;
  const hideEmptyTokenAccount = opts?.hideEmptyTokenAccount ?? false;

  const { currencyToMetaId, primaryAssets } = buildCurrencyLookups(assetsData.cryptoAssets);
  const allAccounts: AccountLike[] = topAccounts.flatMap(a => [a, ...(a.subAccounts ?? [])]);

  const currencyById = new Map<string, CryptoCurrency | TokenCurrency>();
  const groups = new Map<string, MetaGroup>();

  for (const account of allAccounts) {
    const currency = getAccountCurrency(account);
    currencyById.set(currency.id, currency);

    if (shouldSkipAccount(account, showEmptyAccounts, hideEmptyTokenAccount)) continue;

    const metaCurrencyId = currencyToMetaId[currency.id] ?? currency.id;
    const balance = account.balance.toNumber();

    let group = groups.get(metaCurrencyId);
    if (!group) {
      group = {
        metaCurrencyId,
        currency,
        accounts: [],
        countervalue: 0,
        amount: 0,
        networks: new Map(),
      };
      groups.set(metaCurrencyId, group);
    }

    group.accounts.push(account);
    group.marketId ??= assetsData.markets[currency.id]?.id;

    let network = group.networks.get(currency.id);
    if (!network) {
      network = { currency, accounts: [], amount: 0, countervalue: 0 };
      group.networks.set(currency.id, network);
    }
    network.accounts.push(account);
    network.amount += balance;
  }

  if (groups.size === 0) return EMPTY_DISTRIBUTION;

  let sum = 0;
  for (const group of groups.values()) {
    const primaryAssetId = primaryAssets[group.metaCurrencyId];
    const normalizedCurrency = resolveNormalizedCurrency(group.metaCurrencyId);
    const primaryCurrency = currencyById.get(primaryAssetId);
    if (normalizedCurrency) {
      group.currency = normalizedCurrency;
      group.marketId = assetsData.markets[normalizedCurrency.id]?.id ?? normalizedCurrency.id;
    } else {
      if (primaryCurrency) group.currency = primaryCurrency;
      group.marketId ??= assetsData.markets[primaryAssetId]?.id;
    }

    const referenceMagnitude = group.currency.units[0]?.magnitude ?? 0;
    group.amount = sumNetworkAmountsAtReferenceMagnitude(group.networks, referenceMagnitude);

    let groupCountervalue = 0;
    for (const network of group.networks.values()) {
      const countervalue =
        calculate(cvState, { value: network.amount, from: network.currency, to }) ?? 0;
      network.countervalue = countervalue;
      groupCountervalue += countervalue;
    }
    group.countervalue = groupCountervalue;
    sum += groupCountervalue;
  }

  const isAvailable = sum !== 0 || showEmptyAccounts;
  const uniformDistribution = isAvailable ? 1 / groups.size : 0;

  const list: DistributionItem[] = Array.from(groups.values())
    .map(group => ({
      currency: group.currency,
      countervalue: group.countervalue,
      amount: group.amount,
      distribution: computeDistribution(group.countervalue, sum, uniformDistribution),
      accounts: group.accounts,
      metaCurrencyId: group.metaCurrencyId,
      networks: Array.from(group.networks.values()),
      marketId: group.marketId,
      slug: toSlug(group.metaCurrencyId),
    }))
    .sort(
      (a, b) => b.countervalue - a.countervalue || a.currency.name.localeCompare(b.currency.name),
    );

  return { isAvailable, list, showFirst: list.length, sum, bySlug: buildSlugIndex(list) };
}
