import React from "react";
import MemoField from "./MemoField";
import Box from "~/renderer/components/Box";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/mina/types";
import { Account } from "@ledgerhq/types-live";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
}) => {
  return (
    <Box flow={1}>
      <Box
        horizontal
        alignItems="center"
        justifyContent="space-between"
        style={{ width: "50%", paddingRight: 28 }}
      ></Box>
      <Box mb={15} horizontal alignItems="center" justifyContent="space-between">
        <Box grow={1}>
          <MemoField {...props} />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["memo", "transaction"],
};
