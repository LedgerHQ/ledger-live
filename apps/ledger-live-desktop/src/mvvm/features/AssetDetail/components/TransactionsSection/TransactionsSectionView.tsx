import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
  Table,
  TableBody,
  TableRoot,
} from "@ledgerhq/lumen-ui-react";
import { OperationRow } from "LLD/features/History/components/OperationRow";
import { HistoryTableHeader } from "LLD/features/History/components/HistoryTableHeader";
import type { HistoryTable, OperationRow as OperationRowType } from "LLD/features/History/types";

export type TransactionsSectionViewProps = Readonly<{
  historyLabel: string;
  table: HistoryTable;
  onRowClick: (row: OperationRowType) => void;
  onSeeAll: () => void;
}>;

export function TransactionsSectionView({
  historyLabel,
  table,
  onRowClick,
  onSeeAll,
}: TransactionsSectionViewProps) {
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-12" data-testid="asset-detail-transactions-section">
      <Subheader>
        <SubheaderRow onClick={onSeeAll} data-testid="asset-detail-transactions-header">
          <SubheaderTitle>{historyLabel}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>

      <div className="text-body">
        <TableRoot appearance="plain" className="w-full overflow-hidden rounded-12 bg-overlay">
          <Table>
            <HistoryTableHeader />
            <TableBody>
              {rows.map(row => (
                <OperationRow key={row.id} row={row} onRowClick={onRowClick} />
              ))}
            </TableBody>
          </Table>
        </TableRoot>
      </div>
    </div>
  );
}
