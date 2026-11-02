import React, { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  TableCellContent,
  TableCellContentDescription,
  TableCellContentTitle,
  TableCellItem,
  TableInfoIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useLumenDataTable,
} from "@ledgerhq/lumen-ui-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "@shared/i18n";
import { useAssetsTablePorts } from "./assetsTablePorts";
import { PriceCell } from "./PriceCell";
import type { AssetsTablePorts } from "./ports";
import { sanitizeAssetNameForTestId } from "./sanitizeAssetNameForTestId";
import { TrendCell } from "./TrendCell";
import type { AssetTableItem } from "./types";

export type UseAssetTableOptions = {
  /** When false, hides the info tooltip on the trend column header (e.g. full crypto assets page). */
  readonly showTrendColumnTooltip?: boolean;
  /** When false, hides the price column (e.g. assets of a single account). */
  readonly showPriceColumn?: boolean;
};

function columnHeader(Label: AssetsTablePorts["TruncatedText"], label: string) {
  return () => <Label as="span" text={label} />;
}

export function useAssetsTable(assets: readonly AssetTableItem[], options?: UseAssetTableOptions) {
  const showTrendColumnTooltip = options?.showTrendColumnTooltip ?? true;
  const showPriceColumn = options?.showPriceColumn ?? true;
  const { t } = useTranslation();
  const { counterValueCurrency, formatCounterValue, BalanceCell, CounterValueCell, TruncatedText } =
    useAssetsTablePorts();

  const emptyFiatValue = useMemo(
    () => formatCounterValue(counterValueCurrency.units[0], new BigNumber(0), { showCode: true }),
    [counterValueCurrency, formatCounterValue],
  );

  const columns = useMemo<ColumnDef<AssetTableItem>[]>(
    () => [
      {
        accessorKey: "currency",
        header: columnHeader(TruncatedText, t("assets.columns.name")),
        enableSorting: false,
        cell: ({ row }) => {
          const assetTestId = sanitizeAssetNameForTestId(
            `${row.original.currency.name}-${row.original.currency.id}`,
          );
          return (
            <TableCellItem data-testid={`w40-asset-row-${assetTestId}`}>
              <CryptoIcon
                ledgerId={row.original.currency.id}
                ticker={row.original.currency.ticker}
                size={40}
              />
              <TableCellContent>
                <TableCellContentTitle>
                  <TruncatedText text={row.original.currency.name} />
                </TableCellContentTitle>
                <TableCellContentDescription>
                  {row.original.currency.ticker}
                </TableCellContentDescription>
              </TableCellContent>
            </TableCellItem>
          );
        },
      },
      {
        accessorKey: "price",
        header: columnHeader(TruncatedText, t("assets.columns.price")),
        enableSorting: false,
        cell: ({ row }) => (
          <PriceCell currency={row.original.currency} marketPrice={row.original.marketPrice} />
        ),
        meta: { align: "end", hideBelow: "xl" },
      },
      {
        accessorKey: "balance",
        header: columnHeader(TruncatedText, t("assets.columns.balance")),
        enableSorting: false,
        cell: ({ row }) => (
          <BalanceCell currency={row.original.currency} balance={row.original.balance} />
        ),
        meta: { align: "end" },
      },
      {
        accessorKey: "value",
        header: columnHeader(TruncatedText, t("assets.columns.value")),
        enableSorting: false,
        cell: ({ row }) => {
          const assetValueTestId = sanitizeAssetNameForTestId(
            `${row.original.currency.name}-${row.original.currency.id}`,
          );
          return row.original.isPlaceholder ? (
            <div data-testid={`w40-asset-row-value-${assetValueTestId}`}>
              <TableCellItem align="end">
                <TableCellContent>
                  <TableCellContentTitle>{emptyFiatValue}</TableCellContentTitle>
                </TableCellContent>
              </TableCellItem>
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
        header: columnHeader(TruncatedText, t("assets.columns.trend")),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.isPlaceholder ? (
            <TableCellItem align="end">
              <TableCellContent>
                <TableCellContentTitle>
                  <span className="text-muted">0.00%</span>
                </TableCellContentTitle>
              </TableCellContent>
            </TableCellItem>
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
    [t, emptyFiatValue, showTrendColumnTooltip, BalanceCell, CounterValueCell, TruncatedText],
  );

  return useLumenDataTable({
    data: assets as AssetTableItem[],
    columns,
    autoResetPageIndex: false,
    state: { columnVisibility: { price: showPriceColumn } },
  });
}
