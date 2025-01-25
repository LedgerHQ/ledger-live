import React from "react";
import Box from "~/renderer/components/Box";
import MemoValueField from "./MemoValueField";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";

const MemoField = (props: {
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (t: Transaction) => void;
  trackProperties?: Record<string, unknown>;
}) => {
  return (
    <Box flow={1}>
      <MemoValueField {...props} />
    </Box>
  );
};

export default MemoField;
