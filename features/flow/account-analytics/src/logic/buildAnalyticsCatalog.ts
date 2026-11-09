import type { AssetsData } from "@domain/api-aggregated-assets";
import { selectAssetCurrencyIds } from "@features/platform-aggregated-assets";
import type {
  AnalyticsAccountSource,
  AnalyticsCatalog,
  AnalyticsPositionOf,
  AnalyticsPositionSource,
} from "../types";
import { getAnalyticsPositionCurrency } from "./analyticsPositionSource";

type HistorySource<Operation> = Readonly<{
  operations: readonly Operation[];
  subAccounts?: readonly Readonly<{ operations: readonly Operation[] }>[];
}>;

function hasConfirmedAccountHistory<Operation>(
  account: HistorySource<Operation>,
  isConfirmed: (operation: Operation) => boolean,
): boolean {
  return [account, ...(account.subAccounts ?? [])].some(({ operations }) =>
    operations.some(isConfirmed),
  );
}

export function selectEligibleAnalyticsPositions<Account extends AnalyticsAccountSource>(
  accounts: readonly Account[],
  blacklistedIds: readonly string[],
  isConfirmedOperation: (operation: Account["operations"][number], account: Account) => boolean,
): readonly AnalyticsPositionOf<Account>[] {
  const excluded = new Set(blacklistedIds);
  const positions: AnalyticsPositionOf<Account>[] = [];
  for (const account of accounts) {
    const isConfirmed = (operation: Account["operations"][number]) =>
      isConfirmedOperation(operation, account);
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

type AssetMeta = AssetsData["cryptoAssets"][string];

function findAssetMeta(assetsData: AssetsData, currencyId: string): AssetMeta | undefined {
  const meta = Object.values(assetsData.cryptoAssets).find(candidate =>
    Object.values(candidate.assetsIds).includes(currencyId),
  );
  return meta && selectAssetCurrencyIds(assetsData, currencyId).includes(currencyId)
    ? meta
    : undefined;
}

export function buildAnalyticsCatalog(
  positions: readonly AnalyticsPositionSource[],
  accounts: readonly AnalyticsAccountSource[],
  namesById: Readonly<Record<string, string | undefined>>,
  assetsData: AssetsData,
): AnalyticsCatalog {
  const assets = new Map<string, AnalyticsCatalog["assets"][number]>();
  const selectedAccounts = new Set<string>();
  const catalogPositions = positions.map(position => {
    const currency = getAnalyticsPositionCurrency(position);
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
