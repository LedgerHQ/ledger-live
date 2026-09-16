import React from "react";
import {
  TableCell,
  TableCellContent,
  TableCellContentDescription,
  TableCellContentTitle,
  TableCellItem,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { StatusIcon } from "./StatusIcon";
import { useHistoryRowViewModel } from "./useHistoryRowViewModel";
import type { HistoryRowProps } from "./types";

export function HistoryRow({ item, formatters, onRowClick }: HistoryRowProps) {
  const row = useHistoryRowViewModel(item, formatters);

  return (
    <TableRow clickable onClick={() => onRowClick(item)} data-testid={`card-history-row-${row.id}`}>
      <TableCell>
        <TableCellItem>
          <StatusIcon
            category={row.category}
            categoryLabel={row.categoryLabel}
            status={row.status}
          />
          <TableCellContent>
            <TableCellContentTitle>{row.merchant}</TableCellContentTitle>
            <TableCellContentDescription>
              {row.statusLabel ? (
                <span className={row.statusLabelTone === "error" ? "text-error" : "text-muted"}>
                  {row.statusLabel} ·{" "}
                </span>
              ) : null}
              {row.time}
            </TableCellContentDescription>
          </TableCellContent>
        </TableCellItem>
      </TableCell>
      <TableCell align="end">
        {row.fundingLabel ? (
          <TableCellItem align="end">
            <TableCellContent>
              <TableCellContentTitle className="inline-flex items-center justify-end gap-8">
                {row.fundingLabel}
                {row.fundingTooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex"
                        aria-label={row.fundingTooltipAriaLabel}
                        onClick={event => event.stopPropagation()}
                      >
                        <Information size={16} aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{row.fundingTooltip}</TooltipContent>
                  </Tooltip>
                ) : null}
              </TableCellContentTitle>
            </TableCellContent>
          </TableCellItem>
        ) : null}
      </TableCell>
      <TableCell align="end">
        <TableCellItem align="end">
          <TableCellContent>
            <TableCellContentTitle>{row.amount}</TableCellContentTitle>
          </TableCellContent>
        </TableCellItem>
      </TableCell>
    </TableRow>
  );
}
