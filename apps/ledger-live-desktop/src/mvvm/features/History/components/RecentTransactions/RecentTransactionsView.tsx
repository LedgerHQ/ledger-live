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
import { OperationRow } from "../OperationRow";
import { HistoryTableHeader } from "../HistoryTableHeader";
import type { HistoryTable, OperationRow as OperationRowType } from "../../types";

export type RecentTransactionsViewProps = Readonly<{
  title: string;
  testIdPrefix: string;
  table: HistoryTable;
  onRowClick: (row: OperationRowType) => void;
  onSeeAll: () => void;
}>;

export function RecentTransactionsView({
  title,
  testIdPrefix,
  table,
  onRowClick,
  onSeeAll,
}: RecentTransactionsViewProps) {
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-12" data-testid={`${testIdPrefix}-section`}>
      <Subheader>
        <SubheaderRow onClick={onSeeAll} data-testid={`${testIdPrefix}-header`}>
          <SubheaderTitle>{title}</SubheaderTitle>
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
