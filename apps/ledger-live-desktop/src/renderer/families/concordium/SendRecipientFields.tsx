import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/concordium/types";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import Box from "~/renderer/components/Box";
import MemoField from "./MemoField";

type Props = {
  transaction: Transaction;
  account: Account;
  onChange: (t: Transaction) => void;
  status: TransactionStatus;
  autoFocus?: boolean;
  trackProperties?: Record<string, unknown>;
};

const Root = ({ transaction, account, onChange, status, autoFocus, trackProperties }: Props) => {
  return (
    <Box flow={1}>
      <MemoField
        onChange={onChange}
        account={account}
        transaction={transaction}
        status={status}
        autoFocus={autoFocus}
        trackProperties={trackProperties}
      />
    </Box>
  );
};

export default {
  component: Root,
  fields: ["memo"],
};
