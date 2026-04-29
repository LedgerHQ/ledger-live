import React, { useMemo } from "react";
import {
  TableCellContent,
  TableInfoIcon,
  useLumenDataTable,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { ColumnDef } from "@tanstack/react-table";
import { PriceCell } from "../components/Cells/PriceCell";
import { BalanceCell } from "../components/Cells/BalanceCell";
import { CounterValueCell } from "../components/Cells/CounterValueCell";
import { TrendCell } from "../components/Cells/TrendCell";
import { sanitizeAssetNameForTestId } from "../utils/assetTableHelpers";
import type { AssetTableItem } from "../types";

export type UseAssetTableOptions = {
  /** When false, hides the info tooltip on the trend column header (e.g. full crypto assets page). */
  readonly showTrendColumnTooltip?: boolean;
};

export const useTable = (assets: AssetTableItem[], options?: UseAssetTableOptions) => {
  const showTrendColumnTooltip = options?.showTrendColumnTooltip ?? true;
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const emptyFiatValue = useMemo(
    () => formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(0), { showCode: true }),
    [counterValueCurrency],
  );

  const columns = useMemo<ColumnDef<AssetTableItem>[]>(
    () => [
      {
        accessorKey: "currency",
        header: t("assets.columns.name"),
        enableSorting: false,
        cell: ({ row }) => {
          const assetTestId = sanitizeAssetNameForTestId(
            `${row.original.currency.name}-${row.original.currency.id}`,
          );
          return (
            <div data-testid={`w40-asset-row-${assetTestId}`}>
              <TableCellContent
                leadingContent={
                  row.original.isPlaceholder || shouldDisplayAggregatedAssets ? (
                    <CryptoIcon
                      ledgerId={row.original.currency.id}
                      ticker={row.original.currency.ticker}
                      size={getValidCryptoIconSize(32)}
                    />
                  ) : (
                    <CryptoCurrencyIcon currency={row.original.currency} size={32} />
                  )
                }
                title={row.original.currency.name}
                description={row.original.currency.ticker}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: t("assets.columns.price"),
        enableSorting: false,
        cell: ({ row }) => (
          <PriceCell
            currency={row.original.currency}
            placeholderPrice={row.original.placeholderPrice}
          />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "balance",
        header: t("assets.columns.balance"),
        enableSorting: false,
        cell: ({ row }) => (
          <BalanceCell currency={row.original.currency} balance={row.original.balance} />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "value",
        header: t("assets.columns.value"),
        enableSorting: false,
        cell: ({ row }) => {
          const assetValueTestId = sanitizeAssetNameForTestId(
            `${row.original.currency.name}-${row.original.currency.id}`,
          );
          return row.original.isPlaceholder ? (
            <div data-testid={`w40-asset-row-value-${assetValueTestId}`}>
              <TableCellContent align="end" title={emptyFiatValue} />
            </div>
          ) : (
            <div data-testid={`w40-asset-row-value-${assetValueTestId}`}>
              <CounterValueCell currency={row.original.currency} balance={row.original.balance} />
            </div>
          );
        },
        meta: { align: "end" },
      },
      {
        accessorKey: "trend",
        header: t("assets.columns.trend"),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isPlaceholder ? (
            <TableCellContent align="end" title={<span className="text-muted">0.00%</span>} />
          ) : (
            <TrendCell trend={row.original.trend} />
          ),
        meta: {
          align: "end",
          ...(showTrendColumnTooltip
            ? {
                headerTrailingContent: (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TableInfoIcon />
                    </TooltipTrigger>
                    <TooltipContent>{t("assets.columns.trendTooltip")}</TooltipContent>
                  </Tooltip>
                ),
              }
            : {}),
        },
      },
    ],
    [t, emptyFiatValue, showTrendColumnTooltip, shouldDisplayAggregatedAssets],
  );

  const table = useLumenDataTable({
    data: assets,
    columns,
    autoResetPageIndex: false,
  });

  return table;
};
