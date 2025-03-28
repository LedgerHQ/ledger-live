import React from "react";
import { useSelector } from "react-redux";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import OperationRow from "~/components/OperationRow";
import { parentAccountSelector } from "~/reducers/accounts";
import { State } from "~/reducers/types";

type OperationRowContainerProps = {
  operation: Operation;
  account: AccountLike;
  multipleAccounts: boolean;
  isLast: boolean;
};

export function OperationRowContainer({
  operation,
  account,
  multipleAccounts,
  isLast,
}: Readonly<OperationRowContainerProps>) {
  const parentAccount = useSelector((state: State) => parentAccountSelector(state, { account }));

  return (
    <OperationRow
      operation={operation}
      parentAccount={parentAccount}
      account={account}
      multipleAccounts={multipleAccounts}
      isLast={isLast}
    />
  );
}
