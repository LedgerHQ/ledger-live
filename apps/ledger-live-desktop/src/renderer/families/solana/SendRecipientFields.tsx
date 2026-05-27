import React from "react";
import { Trans } from "react-i18next";
import MemoValueField from "./MemoValueField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import {
  TransactionStatus,
  Transaction,
  SolanaAccount,
} from "@ledgerhq/live-common/families/solana/types";
import { useFeature } from "@features/platform-feature-flags";

type Props = {
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  account: SolanaAccount;
};

const Root = (props: Props) => {
  const lldMemoTag = useFeature("lldMemoTag");

  return (
    <Box flow={1}>
      {!lldMemoTag?.enabled && (
        <Box mb={10}>
          <Label>
            <span>
              <Trans i18nKey="families.solana.memo" />
            </span>
          </Label>
        </Box>
      )}

      <Box flow={1}>
        <MemoValueField {...props} />
      </Box>
    </Box>
  );
};
export default {
  component: Root,
  fields: ["memo"],
};
