import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import Box from "~/renderer/components/Box";
import CommentField from "./CommentField";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
  autoFocus?: boolean;
}) => {
  return (
    <Box
      mb={15}
      horizontal
      grow
      alignItems="center"
      justifyContent="space-between"
      maxWidth={"100%"}
      id="commentField"
    >
      <Box grow={1} maxWidth={"100%"}>
        <CommentField {...props} />
      </Box>
    </Box>
  );
};
export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  // If he format a comment incorrectly
  fields: ["comment", "transaction"],
};
