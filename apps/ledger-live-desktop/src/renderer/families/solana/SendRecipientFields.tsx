import React from "react";
import MemoValueField from "./MemoValueField";
import Box from "~/renderer/components/Box";
import {
  TransactionStatus,
  Transaction,
  SolanaAccount,
} from "@ledgerhq/live-common/families/solana/types";

type Props = {
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  account: SolanaAccount;
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
  fields: ["memo"],
};
