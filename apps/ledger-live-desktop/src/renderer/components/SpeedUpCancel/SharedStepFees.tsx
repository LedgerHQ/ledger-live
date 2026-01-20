import { Account } from "@ledgerhq/types-live";
import React, { Fragment, ReactNode } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";

type SharedStepFeesProps = {
  accountId: string;
  account: Account;
  parentAccount: Account | null | undefined;
  status: TransactionStatus;
  transaction: Transaction;
  onChange: (a: Transaction) => void;
  updateTransaction: (updater: (_: Transaction) => Transaction) => void;
  bridgePending?: boolean;
  transactionToUpdate?: Transaction;
  pendingFeesInfoTitle: string;
  feeDetails: ReactNode;
};

export const SharedStepFees = ({
  accountId,
  account,
  parentAccount,
  status,
  transaction,
  onChange,
  updateTransaction,
  bridgePending,
  transactionToUpdate,
  pendingFeesInfoTitle,
  feeDetails,
}: SharedStepFeesProps) => {
  return (
    <Box flow={4}>
      <CurrencyDownStatusAlert currencies={[account.currency]} />
      <Fragment key={accountId}>
        <SendAmountFields
          account={account}
          parentAccount={parentAccount}
          status={status}
          transaction={transaction}
          onChange={onChange}
          updateTransaction={updateTransaction}
          bridgePending={bridgePending}
          transactionToUpdate={transactionToUpdate}
        />
      </Fragment>
      <Alert type="primary">
        {pendingFeesInfoTitle}
        <ul style={{ marginLeft: "5%" }}>{feeDetails}</ul>
      </Alert>
    </Box>
  );
};
