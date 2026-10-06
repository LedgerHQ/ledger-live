import React, { createContext, useContext } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CellContext } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import type { computeAggregatedAccountsData } from "@ledgerhq/asset-aggregation/index";
import { accountNameWithDefaultSelector, type WalletState } from "~/renderer/reducers/wallet";
import { getAccountAssetsCurrencies } from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";
import {
  AccountAddressCell,
  AccountAssetsCell,
  AccountNameCell,
  AccountRowActionCell,
  AccountValueCell,
  AggregatedAccountNameCell,
  AggregatedAccountValueCell,
} from "./Cell";

export type CryptoTableCellData = {
  readonly walletState: WalletState;
  readonly shouldDisplayAggregatedAssets: boolean;
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
  readonly blacklistedTokenIds: string[];
  readonly aggregatedDataByAccountId: ReturnType<typeof computeAggregatedAccountsData> | null;
  readonly isSyncing: boolean;
  readonly onEditName: (account: AccountLike) => void;
};

const CryptoTableCellDataContext = createContext<CryptoTableCellData | null>(null);

export const CryptoTableCellDataProvider = CryptoTableCellDataContext.Provider;

function useCryptoTableCellData(): CryptoTableCellData {
  const data = useContext(CryptoTableCellDataContext);
  if (!data) {
    throw new Error("Crypto table cells must be rendered inside CryptoTableCellDataProvider");
  }
  return data;
}

type CryptoCellProps = CellContext<AccountLike, unknown>;

export function NameCell({ row }: CryptoCellProps) {
  const { walletState, shouldDisplayAggregatedAssets } = useCryptoTableCellData();
  const displayName = accountNameWithDefaultSelector(walletState, row.original);

  return shouldDisplayAggregatedAssets && row.original.type === "Account" ? (
    <AggregatedAccountNameCell account={row.original} displayName={displayName} />
  ) : (
    <AccountNameCell account={row.original} displayName={displayName} />
  );
}

export function AddressCell({ row }: CryptoCellProps) {
  const { lookupParentAccount } = useCryptoTableCellData();
  return <AccountAddressCell account={row.original} lookupParentAccount={lookupParentAccount} />;
}

export function AssetsCell({ row }: CryptoCellProps) {
  const { blacklistedTokenIds } = useCryptoTableCellData();
  return (
    <AccountAssetsCell currencies={getAccountAssetsCurrencies(row.original, blacklistedTokenIds)} />
  );
}

export function BalanceCell({ row }: CryptoCellProps) {
  const { shouldDisplayAggregatedAssets, aggregatedDataByAccountId } = useCryptoTableCellData();

  if (shouldDisplayAggregatedAssets && aggregatedDataByAccountId) {
    const entry = aggregatedDataByAccountId.get(row.original.id);
    return (
      <AggregatedAccountValueCell
        aggregatedCountervalue={entry?.countervalue ?? new BigNumber(0)}
      />
    );
  }
  return <AccountValueCell account={row.original} />;
}

export function ActionCell({ row }: CryptoCellProps) {
  const { t } = useTranslation();
  const { isSyncing, onEditName } = useCryptoTableCellData();

  return (
    <AccountRowActionCell
      account={row.original}
      editNameAriaLabel={t("cryptoAddresses.table.editName")}
      isSyncing={isSyncing}
      onEditName={onEditName}
    />
  );
}
