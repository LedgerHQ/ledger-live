import React from "react";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import OperationRow from "~/components/OperationRow";
import { useParentAccount } from "~/hooks/useParentAccount";

type OperationRowContainerProps = {
  operation: Operation;
  account: AccountLike;
  multipleAccounts: boolean;
  isLast: boolean;
  testID: string;
};

export function OperationRowContainer({
  operation,
  account,
  multipleAccounts,
  isLast,
  testID,
}: Readonly<OperationRowContainerProps>) {
  const parentAccount = useParentAccount(account);

  return (
    <OperationRow
      operation={operation}
      parentAccount={parentAccount}
      account={account}
      multipleAccounts={multipleAccounts}
      isLast={isLast}
      testID={testID}
    />
  );
}
