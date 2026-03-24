export type { Row, Table, ColumnDef } from "@tanstack/react-table";

import type { Row, Table } from "@tanstack/react-table";
import type { AccountLike, Account, Operation, OperationType } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { BigNumber } from "bignumber.js";

export type OperationTableItem = {
  id: string;
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
  date: Date;
  type: OperationType;
  address: string;
  amount: BigNumber;
  currency: Currency;
};

export type HistoryTable = Table<OperationTableItem>;
export type OperationRow = Row<OperationTableItem>;

export type VirtualItem =
  | { type: "day-header"; day: Date; columnCount: number }
  | { type: "operation"; row: OperationRow };
