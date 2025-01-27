import React from "react";
import Alert from "~/renderer/components/Alert";
import { Flex } from "@ledgerhq/react-ui";
import TranslatedError from "~/renderer/components/TranslatedError";
import { Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/families/solana/types";

type Props = {
  account: Account;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
};

/**
 * SendAmountFields
 *
 * This component renders an alert message when the user has insufficient fund
 * to complete a transaction.
 *
 */
const SendAmountFields = ({ status }: Props) => {
  if (!status.errors.fee) return null;
  return (
    <Flex>
      <Alert type="warning" data-testid="insufficient-funds-warning">
        <TranslatedError error={status.errors.fee} />
      </Alert>
    </Flex>
  );
};

export default {
  component: SendAmountFields,
  fields: [],
};
