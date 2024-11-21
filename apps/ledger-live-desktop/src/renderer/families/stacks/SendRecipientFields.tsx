import React from "react";
import MemoValueField from "./MemoValueField";
import Box from "~/renderer/components/Box";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stacks/types";

type Props = {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
};

const Root = (props: Props) => {
  return (
    <Box flow={1}>
      <MemoValueField {...props} />
    </Box>
  );
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  // If he format a memo incorrectly
  fields: ["memo", "transaction"],
};
