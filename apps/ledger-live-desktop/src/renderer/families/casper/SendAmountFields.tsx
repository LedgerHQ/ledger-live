import React from "react";
import { Trans } from "react-i18next";
import TransferIdField from "./TransferIdField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";

import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import { Account } from "@ledgerhq/types-live";

type Props = {
  account: Account;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  trackProperties?: Record<string, unknown>;
};

const Root = (props: Props) => {
  return (
    <Box flow={1}>
      <Box mb={10}>
        <Label>
          <LabelInfoTooltip text={<Trans i18nKey="families.casper.transferIdWarningText" />}>
            <span>
              <Trans i18nKey="families.casper.transferId" />
            </span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
        <Box grow={1}>
          <TransferIdField
            onChange={props.onChange}
            account={props.account}
            transaction={props.transaction}
            status={props.status}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["transferId", "transaction"],
};
