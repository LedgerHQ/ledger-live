import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ton/types";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import CommentField from "./CommentField";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
}) => {
  return (
    <Box flow={1}>
      <Box mb={10}>
        <Label>
          <LabelInfoTooltip text={<Trans i18nKey="errors.TonCommentInvalid.title" />}>
            <span>
              <Trans i18nKey="families.ton.comment" />
            </span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
        <Box grow={1}>
          <CommentField {...props} />
        </Box>
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
