import React, { useMemo } from "react";
import Alert from "~/renderer/components/Alert";
import { Flex } from "@ledgerhq/react-ui";
import TranslatedError from "~/renderer/components/TranslatedError";
import { Account } from "@ledgerhq/types-live";
import type {
  Transaction,
  TransactionStatus,
  SolanaTokenAccount,
} from "@ledgerhq/live-common/families/solana/types";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import TokenTransferFeesWarning from "./Token2022/TokenTransferFeesWarning";

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
const SendAmountFields = ({ account, transaction, status }: Props) => {
  const tokenAccount = useMemo(
    () =>
      transaction.subAccountId
        ? (findSubAccountById(account, transaction.subAccountId) as SolanaTokenAccount)
        : undefined,
    [account, transaction.subAccountId],
  );
  return (
    <Flex>
      {status.errors.fee ? (
        <Alert type="warning" data-testid="insufficient-funds-warning">
          <TranslatedError error={status.errors.fee} />
        </Alert>
      ) : null}
      {tokenAccount ? (
        <TokenTransferFeesWarning tokenAccount={tokenAccount} transaction={transaction} />
      ) : null}
    </Flex>
  );
};

export default {
  component: SendAmountFields,
  fields: [],
};
