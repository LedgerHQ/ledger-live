import React from "react";
import Box from "~/renderer/components/Box";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";

import MemoField from "./MemoField";
import FeeTooHighErrorField from "./FeeTooHighErrorField";

const Root = (props: {
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (t: Transaction) => void;
  trackProperties?: Record<string, unknown>;
}) => {
  return (
    <Box>
      <MemoField {...props} />
      <FeeTooHighErrorField {...props} />
    </Box>
  );
};

export default {
  component: Root,
  fields: ["memo"],
};
