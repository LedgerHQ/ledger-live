import type { AnalyticsCatalog } from "@features/flow-account-analytics";
import { hasConfirmedAccountHistory } from "@features/flow-account-detail-analytics-notice";
import { selectAssetCurrencyIds } from "@features/platform-aggregated-assets";
import type { AssetsData } from "@domain/api-aggregated-assets";
import type { CryptoAssetMeta } from "@domain/entity-aggregated-asset";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { isConfirmedOperation } from "@ledgerhq/ledger-wallet-framework/operation";

export function selectEligibleAnalyticsPositions(
  accounts: readonly Account[],
  blacklistedIds: readonly string[],
  confirmations: Readonly<Record<string, number>>,
): readonly AccountLike[] {
  const excluded = new Set(blacklistedIds);
  const positions: AccountLike[] = [];
  for (const account of accounts) {
    const isConfirmed = (operation: Account["operations"][number]) =>
      isConfirmedOperation(operation, account, confirmations[account.currency.id]);
    if (
      !excluded.has(account.currency.id) &&
      (!account.balance.isZero() || hasConfirmedAccountHistory(account, isConfirmed))
    ) {
      positions.push({ ...account, subAccounts: undefined });
    }
    for (const token of account.subAccounts ?? []) {
      if (
        !excluded.has(token.token.id) &&
        (!token.balance.isZero() ||
          hasConfirmedAccountHistory({ operations: token.operations }, isConfirmed))
      )
        positions.push(token);
    }
  }
  return positions;
}

function findAssetMeta(assetsData: AssetsData, currencyId: string): CryptoAssetMeta | undefined {
  const meta = Object.values(assetsData.cryptoAssets).find(candidate =>
    Object.values(candidate.assetsIds).includes(currencyId),
  );
  return meta && selectAssetCurrencyIds(assetsData, currencyId).includes(currencyId)
    ? meta
    : undefined;
}

export function buildAnalyticsCatalog(
  positions: readonly AccountLike[],
  accounts: readonly Account[],
  namesById: Readonly<Record<string, string | undefined>>,
  assetsData: AssetsData,
): AnalyticsCatalog {
  const assets = new Map<string, AnalyticsCatalog["assets"][number]>();
  const selectedAccounts = new Set<string>();
  const catalogPositions = positions.map(position => {
    const currency = getAccountCurrency(position);
    const meta = findAssetMeta(assetsData, currency.id);
    const assetId = meta ? `asset:${meta.id}` : `currency:${currency.id}`;
    const accountId = position.type === "Account" ? position.id : position.parentId;
    selectedAccounts.add(accountId);
    if (!assets.has(assetId))
      assets.set(assetId, {
        id: assetId,
        name: meta?.name ?? currency.name,
        ticker: meta?.ticker ?? currency.ticker,
        iconId: currency.id,
      });
    return { positionId: position.id, accountId, currencyId: currency.id, assetId };
  });
  return {
    assets: [...assets.values()].sort((a, b) => a.name.localeCompare(b.name)),
    accounts: accounts
      .filter(account => selectedAccounts.has(account.id))
      .map(account => ({
        id: account.id,
        name: namesById[account.id] ?? account.currency.name,
        iconId: account.currency.id,
        ticker: account.currency.ticker,
        networkName: account.currency.name,
        address: account.freshAddress,
      })),
    positions: catalogPositions,
  };
}
