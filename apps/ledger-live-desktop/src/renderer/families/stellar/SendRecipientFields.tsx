import React from "react";
import { Trans } from "react-i18next";
import MemoTypeField from "./MemoTypeField";
import MemoValueField from "./MemoValueField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";
import { Account } from "@ledgerhq/types-live";

type Props = {
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  account: Account;
};

const Root = ({ transaction, account, onChange, status }: Props) => {
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
      {transaction.memoTypeRecommended && (
        <Box horizontal grow justifyContent="space-between">
          <Text ff="Inter|Regular" color="palette.text.shade50" fontSize={4}>
            <Trans i18nKey="families.stellar.recommendedMemo" />
          </Text>
        </Box>
      )}
    </Box>
  );
};
export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  // If he format a memo incorrectly
  fields: ["memoType", "transaction"],
};
