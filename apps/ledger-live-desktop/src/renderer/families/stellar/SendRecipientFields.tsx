import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import MemoTypeField from "./MemoTypeField";
import MemoValueField from "./MemoValueField";
import { TransactionStatus, Transaction } from "@ledgerhq/live-common/families/stellar/types";
import { Account } from "@ledgerhq/types-live";

const Root = ({
  transaction,
  account,
  onChange,
  status,
}: {
  transaction: Transaction;
  account: Account;
  onChange: (t: Transaction) => void;
  status: TransactionStatus;
}) => {
  const memoActivated = transaction.memoType && transaction.memoType !== "NO_MEMO";
  return (
    <Box flow={1}>
      <Box mb={10}>
        <Label>
          <LabelInfoTooltip text={<Trans i18nKey="families.stellar.memoWarningText" />}>
            <span>
              <Trans i18nKey="families.stellar.memo" />
            </span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
        <MemoTypeField onChange={onChange} account={account} transaction={transaction} />
        {memoActivated ? (
          <Box ml={20} grow={1}>
            <MemoValueField
              onChange={onChange}
              account={account}
              transaction={transaction}
              status={status}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  // If he format a memo incorrectly
  fields: ["memoType", "transaction"],
};
